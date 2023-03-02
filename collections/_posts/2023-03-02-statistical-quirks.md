---
layout: post
title: Statistical quirks
date: 2023-03-02
summary: Looking at some of the oddities in statistics
categories: working travel
mathjax: true
---

Statistics is an essential tool for data analysis, but even experienced statisticians might not deeply understand how some statistics work or are connected. I get especially interested by the interesting quirks or when one thing is really another in disguise.

### One test disguised as another

Statistical tests can be deceivingly similar, which I think can help to remember how they work. For instance, paired t-tests are a clever implementation of a one-sample t-test. With a one-sample t-test, you are just testing if a sampled point estimate of the mean is different to the population mean. For two-sample t-tests, you take the difference between your pairs, and if the mean of that point estimate is not likely to be 0, you have a significant result.

Similarly, Wilcoxon tests are derived from classic binomial tests. With a binomial test on paired data, you can just count the total number below and above the estimate median of 0. Say you run an experiment on 12 people and take before and after drug measurements. If 10 measurements increase and 2 decrease then you can just throw that into your binomial test:

```python
> st.binomtest(10, 12, 0.5).pvalue
0.03857421875
```

Without much thinking you've made yourself a non-parametric paired test! Wilcoxon's method uses this as the base, also ranking the results for more insight but it's fundamentally very similar.


### Probability of a specific event
Perhaps counterintuitively, the probability of a single event occuring for continuous distributions is 0. So for a distribution of person's height, say with 1.8m mean and 0.2m standard deviation, that mean itself has a 0 probability of occuring. Why would this be the case?

The answer comes from calculus. Any p-value calculation is taking the integral of a distribution between Z-score bounds. The integral of a single point like the mean is zero, because the area under a point is zero.

### One-sidededness of a chi-square test
I owe this one to the (Cross Validated forums)[!https://stats.stackexchange.com/questions/22347/is-chi-squared-always-a-one-sided-test] but it is too interesting not to share. Why are we only ever interested in chi-square tests as a right tail test? It comes back to what the test is doing - checking the goodness of fit between two distributions. Either an idealised distribution or alternate real category is compared to a sampled distribution, and you want to know if they are close enough to guess that they come from the same population. You generally are only interested if they are too different, too similar isn't often an issue. However there are cases of fraud or result tampering, where you might be interested if a set of results is just too good to be true. In this case a left-tailed test might be the right one to use.

### Proportion tests and sample sizes
Statistics of proportions are interesting because you can get so much just from the point estimate of the proportion (p) and the size of the sample (n). For example, standard deviation is just sqrt(p(1−p)) and the standard error is sd/sqrt(n). Getting so much information from so little is powerful because of how often this is necessary for simple surveying.

For example, for a city, you may be interested in the percentage of vegetarians. How many people do you need to ask to have a confidence within a 5 percentile band? A confidence interval is just CI = p ± z * sd, and for this example the sd is your se.

To obtain sample size, you can rearrange this to be:

$ {CI \over z}^2 = {p(1-p) \over n} $

$ n = {z^2p(1-p) \over CI^2}$

So for our example it may be:

$ n = \frac{1.96^2*0.5*0.5}{0.05^2} $

$ n = 385 \text{ sample size.} $

Using 0.5 is the most conservative estimate for the proportion, if it were 0.1 instead (10% vegetarians) you would get 139 sample size. This is also known as Cochrane's method, and perhaps not an oddity but something I found interesting.


### Central Limit Theorem
Finally, this is more a tribute to how amazing the CLT is. Maybe one day I'll have a crack at replicating one of the proofs and describing it in an intuitive way but for now, it's extraordinary how simple it makes so much of statistics and the idea of parametric tests probably wouldn't exist (or would be very niche) without it.


### Conclusion
These are just a few parts of stats which have piqued my interest. Some are more obvious than others but all have made me better understand statistics.