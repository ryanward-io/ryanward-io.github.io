---
layout: post
title: Python - Making a year-on-year chart with variance
date: 2021-03-27
summary: Finale of the year-on-year trilogy.
categories: visualisation python
---

This is part 3 in a series on charting year-on-year variance. I previously explained how to make a year-on-year chart with variance in Excel.

This is a similar tutorial but in Python. This notebook is also in a [github repo here](https://github.com/ryanward-io/year-on-year-variance).

### Starting with importing libraries and the data

```python
import pandas as pd
import matplotlib.pyplot as plt

f = 'https://raw.githubusercontent.com/ryanward-io/year-on-year-variance/main/IDCJAC0001_086232_Data.csv'
rainfall = pd.read_csv(f)
rainfall = rainfall.iloc[-6:].drop(['Product code', 'Station Number', 'Annual'], axis=1).set_index('Year').T.copy()
rainfall
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
      <th>Year</th>
      <th>2015</th>
      <th>2016</th>
      <th>2017</th>
      <th>2018</th>
      <th>2019</th>
      <th>2020</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Jan</th>
      <td>56.8</td>
      <td>53.4</td>
      <td>33.2</td>
      <td>73.6</td>
      <td>12.6</td>
      <td>129.4</td>
    </tr>
    <tr>
      <th>Feb</th>
      <td>41.4</td>
      <td>9.2</td>
      <td>47.0</td>
      <td>1.2</td>
      <td>20.3</td>
      <td>75.8</td>
    </tr>
    <tr>
      <th>Mar</th>
      <td>24.4</td>
      <td>38.2</td>
      <td>29.2</td>
      <td>24.6</td>
      <td>14.6</td>
      <td>78.2</td>
    </tr>
    <tr>
      <th>Apr</th>
      <td>NaN</td>
      <td>49.7</td>
      <td>142.7</td>
      <td>19.0</td>
      <td>11.6</td>
      <td>145.6</td>
    </tr>
    <tr>
      <th>May</th>
      <td>42.8</td>
      <td>60.2</td>
      <td>29.6</td>
      <td>72.2</td>
      <td>63.5</td>
      <td>82.8</td>
    </tr>
    <tr>
      <th>Jun</th>
      <td>NaN</td>
      <td>71.3</td>
      <td>21.4</td>
      <td>47.2</td>
      <td>57.5</td>
      <td>30.8</td>
    </tr>
    <tr>
      <th>Jul</th>
      <td>65.0</td>
      <td>68.6</td>
      <td>35.6</td>
      <td>22.0</td>
      <td>52.8</td>
      <td>32.4</td>
    </tr>
    <tr>
      <th>Aug</th>
      <td>41.0</td>
      <td>69.4</td>
      <td>NaN</td>
      <td>49.4</td>
      <td>64.3</td>
      <td>68.8</td>
    </tr>
    <tr>
      <th>Sep</th>
      <td>33.2</td>
      <td>104.6</td>
      <td>46.7</td>
      <td>19.0</td>
      <td>51.4</td>
      <td>26.8</td>
    </tr>
    <tr>
      <th>Oct</th>
      <td>11.8</td>
      <td>70.2</td>
      <td>43.4</td>
      <td>24.9</td>
      <td>27.7</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Nov</th>
      <td>46.4</td>
      <td>36.4</td>
      <td>46.2</td>
      <td>69.6</td>
      <td>60.8</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>Dec</th>
      <td>NaN</td>
      <td>47.7</td>
      <td>119.2</td>
      <td>117.3</td>
      <td>4.4</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>

### Make 2015-19 average, min and max columns

```python
yr_2015_2019_cols = [2015, 2016, 2017, 2018, 2019]
rainfall['2015-2019 avg'] = rainfall.loc[:, yr_2015_2019_cols].mean(axis=1)
rainfall['2015-2019 max'] = rainfall.loc[:, yr_2015_2019_cols].max(axis=1)
rainfall['2015-2019 min'] = rainfall.loc[:, yr_2015_2019_cols].min(axis=1)
rainfall_yoy = rainfall.drop(yr_2015_2019_cols, axis=1)
rainfall_yoy
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
      <th>Year</th>
      <th>2020</th>
      <th>2015-2019 avg</th>
      <th>2015-2019 max</th>
      <th>2015-2019 min</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Jan</th>
      <td>129.4</td>
      <td>45.920</td>
      <td>73.6</td>
      <td>12.6</td>
    </tr>
    <tr>
      <th>Feb</th>
      <td>75.8</td>
      <td>23.820</td>
      <td>47.0</td>
      <td>1.2</td>
    </tr>
    <tr>
      <th>Mar</th>
      <td>78.2</td>
      <td>26.200</td>
      <td>38.2</td>
      <td>14.6</td>
    </tr>
    <tr>
      <th>Apr</th>
      <td>145.6</td>
      <td>55.750</td>
      <td>142.7</td>
      <td>11.6</td>
    </tr>
    <tr>
      <th>May</th>
      <td>82.8</td>
      <td>53.660</td>
      <td>72.2</td>
      <td>29.6</td>
    </tr>
    <tr>
      <th>Jun</th>
      <td>30.8</td>
      <td>49.350</td>
      <td>71.3</td>
      <td>21.4</td>
    </tr>
    <tr>
      <th>Jul</th>
      <td>32.4</td>
      <td>48.800</td>
      <td>68.6</td>
      <td>22.0</td>
    </tr>
    <tr>
      <th>Aug</th>
      <td>68.8</td>
      <td>56.025</td>
      <td>69.4</td>
      <td>41.0</td>
    </tr>
    <tr>
      <th>Sep</th>
      <td>26.8</td>
      <td>50.980</td>
      <td>104.6</td>
      <td>19.0</td>
    </tr>
    <tr>
      <th>Oct</th>
      <td>NaN</td>
      <td>35.600</td>
      <td>70.2</td>
      <td>11.8</td>
    </tr>
    <tr>
      <th>Nov</th>
      <td>NaN</td>
      <td>51.880</td>
      <td>69.6</td>
      <td>36.4</td>
    </tr>
    <tr>
      <th>Dec</th>
      <td>NaN</td>
      <td>72.150</td>
      <td>119.2</td>
      <td>4.4</td>
    </tr>
  </tbody>
</table>
</div>

### Let’s check what it looks like out of the box

```python
plt.plot(rainfall_yoy)
plt.legend(rainfall_yoy.columns)
plt.show()
```

![Confusing chart showing year-on-year information](/images/posts/2021-03-27-yoy-variance-chart-python_files/2021-03-27-yoy-variance-chart-python_5_0.png)

### Plotting the nicer looking chart

```python
# data
x = rainfall_yoy.index.values
y_2020 = rainfall_yoy[2020].values
y_2015_2019_avg = rainfall_yoy['2015-2019 avg'].values
y_2015_2019_max = rainfall_yoy['2015-2019 max'].values
y_2015_2019_min = rainfall_yoy['2015-2019 min'].values

# initialise the plot and plot the three charts
fig, ax = plt.subplots(figsize=[10,5])
ax.plot(x, y_2020, '-', color='#0000ff', linewidth=3)
ax.plot(x, y_2015_2019_avg, '-', color='#aa0000')
ax.fill_between(x, y_2015_2019_min, y_2015_2019_max, color='#aa0000', alpha=0.2)

# add out legend and labels
ax.legend(['2020', '2015-2019 avg', '2015-2019 min and max'])
ax.set_xlabel('Month')
ax.set_ylabel('Rainfall (mm)')
ax.set_title('Rainfall in 2020 vs average of 2015-2019')

plt.show()
```

![Nicer looking python chart showing year-on-year variance](/images/posts/2021-03-27-yoy-variance-chart-python_files/2021-03-27-yoy-variance-chart-python_7_0.png)

Enjoy!
