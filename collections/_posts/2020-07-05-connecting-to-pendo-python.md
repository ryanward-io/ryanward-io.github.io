---
layout: post
title: Connecting to Pendo using Python
date: 2020-07-05
summary: Let's get the data in your own hands.
categories: product python
---

### When would this matter?

So you’ve developed your app/MVP, acquired customers and want to keep growing and bringing in new revenue.

Before long, you’ll want to understand exactly how your users interact with your app.

Some of this, such as page views, can be done with Google Analytics but other companies such as Pendo, Amplitude and Heap give much more granular information on what users have interacted with and what journeys they take throughout your app.

The approach below can help specifically if you want to pull a full history of your Pendo data.

While Pendo does have its [own API documentation](https://developers.pendo.io/docs/), I recently found myself needing to do a lot of extra engineering to pull all the data through into Power BI. Anyway – let’s get into it.

### Importing libraries and defining variables

Below we are importing all the libraries we’ll need and defining some variables we’ll use throughout our code.

- **Start date** is the first date you’ll go back to when pulling your Pendo data
- Your **integration key** authenticates you to Pendo. You can access by going to app.pendo.io then Integrations as an admin
- For **app_id**, your first app associated with your subscription will always have an ID of -323232. After that it is system generated. You can check it by looking at your account.
- **Headers** are what we send through to Pendo to help authenticate who we are and what we are sending them
- The **url** is the API endpoint we are connecting to

```python
import requests
import json
from datetime import datetime, timedelta
import pandas as pd

start_date = "2020-07-01"
integration_key = "your-key-here-as-string"
app_id = -323232
headers = {
    'x-pendo-integration-key': integration_key ,
    'content-type': "application/json"
}
url = "https://app.pendo.io/api/v1/aggregation"
```

### Defining some useful utility functions

Below we’ll create two utility functions.

1. The first converts a day into UNIX time – which is what Pendo reads it in. We’ll need this when requesting data of Pendo.
2. The second calculates the difference between our start date (defined above) and the current date to return the number of days in that period. This is how many times we’ll need to request data from the API as you only get one individual day at a time.

```python
def date_in_ms(date, offset=0):
    # converts a day into UNIX time (this is the format Pendo reads it in)
    dt = datetime.strptime(date, '%Y-%m-%d').timestamp()
    i = int(offset) * 24 * 60 * 60
    dt_ms = (int(dt) + int(i)) * 1000
    return str(dt_ms)

def day_delta(start_date_str):
    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    current_date = datetime.now()
    day_delta = (current_date - start_date).days + 1
    return day_delta
```

### Defining the body of the API request

Pendo has two types of records.

- **Entity tables** which give status-based records (e.g. users or pages) with their current status at a point of time; and
- **Event tables** which give transaction-based records (e.g. how many times a user clicked a feature) for a specified period of time.

The code below picks up which type of table we are requesting and only includes a timeseries request if we want an Event Table.

These JSON payloads can get extremely deep and complex if you want them to. However, I’ve always found it easier to just extract the data as a flat file, and then manipulate in a format I’m comfortable with (Pandas) rather than learning Pendo’s bespoke aggregation methodology.

```python
def data_body(source_name, dt):
    if dt is not None:
        payload = json.dumps({
            "response": {"mimeType": "application/json"},
            "request": {
                "pipeline": [{
                    "source": {
                        source_name: {"appId": app_id},
                        "timeSeries": {
                            "first": dt,
                            "count": 1,
                            "period": "dayRange"
                        }
                    }
                }]
            }
        })
        return payload
    else:
        payload = json.dumps({
            "response": {"mimeType": "application/json"},
            "request": {
                "pipeline": [{
                    "source": {
                        source_name: {"appId": app_id}
                    }
                }]
            }
        })
    return payload
```

### Define the API call and convert into a Dataframe

Title says it all. Worth noting in this code if you are using a slightly older version of Pandas, you need to use `pd.io.json.json_normalize()` rather than `pd.json_normalize()`.

```python
def API_response_into_df(source_name, start_date_ms):
    data = data_body(source_name, start_date_ms)
    response = requests.post(url, headers=headers, data=data)
    response_dict = json.loads(response.text)
    results_li = response_dict['results']
    if results_li is not None:
        return pd.json_normalize(results_li)
    else:
        return None
```

### Return all Pendo events and entities

```python
def return_Pendo_events(source_name, start_date):
    days = day_delta(start_date)
    for i in range(days):
        dt = date_in_ms(start_date, i)
        dt_str = datetime.fromtimestamp(int(dt) // 1000).strftime('%Y-%m-%d')
        df_temp = API_response_into_df(source_name, dt)
        if df_temp is None:
            print(f"Skipping {dt_str} (day {i} from {start_date}) as no results returned.")
        else:
            try:
                df_response = pd.concat([df_response, df_temp], sort=False)
                print(f"Appending {dt_str} (day {i}) to {source_name} df.")
            except NameError:
                df_response = df_temp
                print(f"Created {source_name} df.")
    df_response.drop(columns=["appId", "remoteIp", "userAgent", "parameters"], inplace=True, errors='ignore')
    try:
        df_response['day'] = pd.to_datetime(df_response['day'], unit="ms").dt.strftime('%Y-%m-%d')
    except:
        df_response['browserTime'] = pd.to_datetime(df_response['browserTime'], unit="ms").dt.strftime('%Y-%m-%d %H:%M')
    return df_response

def return_Pendo_entities(source_name, cols_to_rename, cols_to_keep):
    df_temp = API_response_into_df(source_name, None)
    print(f"Created {source_name} df.")
    if cols_to_keep is not None:
        df_temp = df_temp.rename(columns=cols_to_rename)
    if cols_to_keep is not None:
        df_temp = df_temp[cols_to_keep]
    return df_temp
```

### Get lookup tables to return real names rather than Pendo IDs

This gets you human-understandable names such as Dashboard rather than some arbitrary pageId string.

```python
def merge_tables(left_table, li):
    for i in li:
        try:
            left_table = pd.merge(left_table, i['table'], how='left', on=i['id'])
        except KeyError:
            pass
    return left_table


accounts_df = return_Pendo_entities(
    'accounts',
    cols_to_rename={'metadata.agent.name': "account_name"},
    cols_to_keep=['accountId', 'account_name'])

features_df = return_Pendo_entities(
    'features',
    cols_to_rename={'id': "featureId", "name": "feature_name", 'group.name': "group_name"},
    cols_to_keep=['featureId', 'feature_name', 'pageId', 'group_name'])

visitors_df = return_Pendo_entities(
    'visitors',
    cols_to_rename={'metadata.agent.email': "visitor_email"},
    cols_to_keep=['visitorId', 'visitor_email'])

pages_df = return_Pendo_entities(
    'pages',
    cols_to_rename={'id': "pageId", "name": "page_name"},
    cols_to_keep=['pageId', 'page_name'])

guides_df = return_Pendo_entities(
    'guides',
    cols_to_rename={'id': "guideId", "name": "guide_name"},
    cols_to_keep=['guideId', 'guide_name'])


merge_table_list = [
    {"table": accounts_df, "id": "accountId"},
    {"table": visitors_df, "id": "visitorId"},
    {"table": features_df, "id": "featureId"},
    {"table": pages_df, "id": "pageId"},
    {"table": guides_df, "id": "guideId"}
]
```

### Finally, run your code and get all the data

```python
def create_pendo_event_df(APIname, start_date=start_date, merge_table_list=merge_table_list):
    df = return_Pendo_events(APIname, start_date)
    df = merge_tables(df, merge_table_list)
    return df

feature_event_df = create_pendo_event_df("featureEvents")
page_event_df = create_pendo_event_df("pageEvents")
poll_event_df = create_pendo_event_df("pollEvents")
event_df = create_pendo_event_df("events")
```
