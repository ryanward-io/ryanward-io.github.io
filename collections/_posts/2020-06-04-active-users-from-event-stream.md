---
layout: post
title: Calculating Active Users (DAU, MAU) from an event stream
date: 2020-06-04
summary: It's not going to improve until you measure the problem.
categories: product python
---

### Background

A key product metric looks at Daily Active Users over Monthly Active Users (DAU/MAU). It is commonly used as a proxy for user engagement and is widely used by product teams and businesses. I’ve seen a few definitions but the one I use means that DAU, MAU, etc are defined as the count of unique visitors that have visited in the past X days – ie for MAU it is a rolling 30 days.

I recently found I needed to calculate this from a stream of aggregated event data. You could take a similar approach with a pure event stream, but it may be worth grouping by visitors and dates depending on the size of your data so it doesn’t take forever.

Despite searching, I couldn’t find anything that quickly solved my problem so took the following approach:

1. Import pandas and the event stream as a DataFrame (df1);
2. Set up a new DataFrame (df2) with one row for each date in the date range; and
3. Loop through df1 for each date in df2 and record a distinct count of visitors for the relevant period in df2.

The data we'll use can just be generated as follows:

```python
from datetime import datetime as dt, timedelta as td
import numpy as np
import pandas as pd

col_names = ['visitor_id', 'date', 'page_views', 'feature_clicks']

visitor_ids = range(1,51)
dates = [dt(2020, 7, 1) + td(days=x) for x in range(30)]

data = []

for d in dates:
    for id in visitor_ids:
        data.append([id, d, np.random.randint(1e2), np.random.randint(1e3)])
```

### Code

Step 1 is housekeeping. While we'll use the generated data it would more likely connecting to an API or a database.

```python
full_df = pd.DataFrame(data, columns=col_names)
full_df.sample(5)
```

<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>visitor_id</th>
      <th>date</th>
      <th>page_views</th>
      <th>feature_clicks</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>1255</th>
      <td>6</td>
      <td>2020-07-26</td>
      <td>52</td>
      <td>562</td>
    </tr>
    <tr>
      <th>1423</th>
      <td>24</td>
      <td>2020-07-29</td>
      <td>21</td>
      <td>659</td>
    </tr>
    <tr>
      <th>1335</th>
      <td>36</td>
      <td>2020-07-27</td>
      <td>99</td>
      <td>919</td>
    </tr>
    <tr>
      <th>273</th>
      <td>24</td>
      <td>2020-07-06</td>
      <td>23</td>
      <td>609</td>
    </tr>
    <tr>
      <th>815</th>
      <td>16</td>
      <td>2020-07-17</td>
      <td>24</td>
      <td>854</td>
    </tr>
  </tbody>
</table>
</div>

We'll use an exponential decay function to emulate the drop-off in user activity. This takes the form of $y = ab^x$. We'll keep it simple and use $y = 1.001^{-x}$ as a mask against the index of our new dataframe.

```python
mask = [(1.0005**-i)>np.random.rand() for i in full_df.index]
event_df = full_df.loc[mask]
event_df # roughly a third of the rows have been dropped
```

<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>visitor_id</th>
      <th>date</th>
      <th>page_views</th>
      <th>feature_clicks</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>1</td>
      <td>2020-07-01</td>
      <td>49</td>
      <td>814</td>
    </tr>
    <tr>
      <th>1</th>
      <td>2</td>
      <td>2020-07-01</td>
      <td>83</td>
      <td>857</td>
    </tr>
    <tr>
      <th>2</th>
      <td>3</td>
      <td>2020-07-01</td>
      <td>42</td>
      <td>215</td>
    </tr>
    <tr>
      <th>3</th>
      <td>4</td>
      <td>2020-07-01</td>
      <td>21</td>
      <td>309</td>
    </tr>
    <tr>
      <th>4</th>
      <td>5</td>
      <td>2020-07-01</td>
      <td>87</td>
      <td>312</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
    <tr>
      <th>1493</th>
      <td>44</td>
      <td>2020-07-30</td>
      <td>46</td>
      <td>82</td>
    </tr>
    <tr>
      <th>1496</th>
      <td>47</td>
      <td>2020-07-30</td>
      <td>96</td>
      <td>729</td>
    </tr>
    <tr>
      <th>1497</th>
      <td>48</td>
      <td>2020-07-30</td>
      <td>99</td>
      <td>858</td>
    </tr>
    <tr>
      <th>1498</th>
      <td>49</td>
      <td>2020-07-30</td>
      <td>22</td>
      <td>496</td>
    </tr>
    <tr>
      <th>1499</th>
      <td>50</td>
      <td>2020-07-30</td>
      <td>44</td>
      <td>932</td>
    </tr>
  </tbody>
</table>
<p>1022 rows × 4 columns</p>
</div>

Step 2 has us write our function that will create an active user table with a single row for each date. Pandas has a function we can easily use to do this – date_range.

```python
def setup_active_user_df(df):
    active_user_df = pd.DataFrame({"date": pd.date_range(df['date'].min(), df['date'].max())})
    return active_user_df
```

Step 3 performs the most work, looping through event_df for each date in our active_users_df. We make sure to use df.loc rather than chained indexing here (e.g. df[col_name][i] ) to avoid potential object issues.

```python
def active_users_in_period(active_user_df, event_df, col_name, period):
    active_user_df[col_name] = 0   # Creates the empty column to be filled in
    for i in range(len(active_user_df)):
        origin_date = active_user_df['date'][i]
        offset_date = origin_date - pd.offsets.Day(int(period))
        # filter the original dataframe and count unique visitors
        count = len(event_df.loc[
                                (event_df['date'] <= origin_date) &
                                (event_df['date'] > offset_date),
                                'visitor_id'].unique())
        active_user_df.loc[i, col_name] = count
    return df
```

```python
df = setup_active_user_df(event_df)
df = active_users_in_period(df, event_df, 'DAU', 1)
df = active_users_in_period(df, event_df, 'MAU', 30)

# You can also add any period you like e.g. Weekly Active Users (WAU)
df = active_users_in_period(df, event_df, 'WAU', 7)

# Calculate DAU/MAU to be able to use it in the chart
df['DAU/MAU'] = df['DAU']/df['MAU']
```

```python
import matplotlib.pyplot as plt

# Set up the chart with minimal formatting
fig, ax = plt.subplots()
ax.plot(df['date'], df['DAU/MAU'])
ax.set_title('DAU/MAU over time')
fig.autofmt_xdate()
ax.set_ylim(0,1)
plt.show()
```

![png](/images/posts/2020-06-04-active-users-from-event-stream_files/2020-06-04-active-users-from-event-stream_11_0.png)

You could clean this up further by removing the initial month (as it is finding it’s initial value in this time), changing the y-axis to a % and giving it a label, and perhaps using better date formatting but this is the crux of it.

Now this is being measured and shared through your product team and business, now you just need to figure out how to increase user engagement to get that number up!
