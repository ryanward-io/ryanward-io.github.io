---
layout: post
title: How to make a scalable tax calculator in Python
date: 2020-07-14
summary: If else is rarely the best solution.
categories: logic python
---

### Why do I need to calculate tax?

Calculating the tax or duty on items is a common requirement. Sometimes it is as simple as multiplying (almost) everything by 10% for a flat Value Added Tax like the Goods and Services Tax (GST). However, sometimes it is more complex and involves a sliding scale of tax based on the value of the good.

Property values in Australia is an example where this sliding scale applies.

If you are a property lawyer, or work in property finance you might find yourself needing to calculate stamp duty on property values. Manually doing this is painful if you have lots of properties to work through, but this is where automation helps.

Tackling this with Python

Looking at the Victorian Stamp Duty rates here we can extract the following parameters to calculate stamp duty.

| Dutiable Value Range | Rate                                                                |
| -------------------- | ------------------------------------------------------------------- |
| $0 – $25,000         | 1.4 per cent of the dutiable value of the property                  |
| $25,001 – $130,000   | $350 plus 2.4 per cent of the dutiable value in excess of $25,000   |
| $130,001 – $440,000  | $2,870 plus 5 per cent of the dutiable value in excess of $130,000  |
| $440,001 – $550,000  | $18,370 plus 6 per cent of the dutiable value in excess of $440,000 |
| $550,001 – $960,000  | $28,070 plus 6 per cent of the dutiable value in excess of $550,000 |
| More than $960,000   | 5.5 per cent of the dutiable value                                  |

By observing the pattern, we can see that it generally follows the rule of the property value minus the lower threshold, multiplied by a percentage, and finally adding a flat amount.

For example if you have a property of $500,000, you would see that the $440,001 to $550,000 range applies and apply:

`($500,000 - $440,000) * 0.06 + $18,370 = $21,970`

The only parameter this doesn’t apply for is more than $960,000. But you can cheat a little if you realise that because $960,000 \* 5.5% is $52,800, these are equivalent statements.

`5.5 per cent of the dutiable value == $52,800 plus 5.5 per cent of the dutiable value in excess of $960,000`

Knowing this we get to our code. We start with just a dummy dataset. I’ve only included property values, but you may have their addresses, contract signing dates, purchasers and other information there too.

We also create a table that contains all parameter information above. Each sublist has the format:

`[lower bound, % duty in excess of lower bound, flat amount to add]`

The final list is 10,000,000,000 or 10 billion. This is added to catch all properties above $960,000 (as I’m assuming no property will be sold for over $10B although there is probably a cleaner way to catch these.

```python
import pandas as pd

df = pd.DataFrame({'property_values': [100000, 240000, 150000, 600000, 650000]})

vic_duty_values = [
    [0, 0.014, 0],
    [25_000, 0.024, 350],
    [130_000, 0.050, 2870],
    [440_000, 0.060, 18_370],
    [550_000, 0.060, 28_070],
    [960_000, 0.055, 52_800],  # 52_800 is 960_000 * 0.055
    [1e12   , 0.0, 0]
]
```

While I could have created a monstrous if else condition, I felt there was too much capacity for human error and it gets unwieldy if you want to add more. With this method, you could just change the duty_values list for any other State (e.g. NSW) and it will still work.

What is next happening in this function, is we are taking each value and checking where it fits in the duty list. Once it finds the range that applies, it can pull the relevant multiplier and amount to add, to calculate the stamp duty.

```python
def duty_calculator(row):
    for i, v in enumerate(vic_duty_values):
        if row['property_values'] < v[0]:
            prev_list = vic_duty_values[i - 1]
            x_lower = prev_list[0]
            multiplier = prev_list[1]
            add_amount = prev_list[2]
            return (row['property_values'] - x_lower) * multiplier + add_amount


df['stamp_duty'] = df.apply(duty_calculator, axis=1)
print(df)
```

       property_values  stamp_duty
    0           100000      2150.0
    1           240000      8370.0
    2           150000      3870.0
    3           600000     31070.0
    4           650000     34070.0

I hope this approach helps tackle any scalable percentage of value issues you face, and I’m sure you’ll agree it is more efficient and easier to read than a large if else statement.
