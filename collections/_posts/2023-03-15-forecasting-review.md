---
layout: post
title: A forecasting lit review
date: 2024-05-15
summary: Likely outdated but maybe a good starting point 
categories: forecasting
mathjax: true
---

# Forecasting literature review

**Note - originally written in 2022**

Extrapolating the future has a mystique that other machine learning doesn't hold for me - even the currently omipresent generative AI. This was something I did a little over a year ago and figured having it live would be a helpful little resource for me to go back to when I need to as a baseline before I update with more recent resources. 

It seems current best practice would suggest a LightGBM model is most effective (by accuracy and uncertainty measures on a specific big data competition run in 2020).
The first three journal articles below are (I think) the most informative although the last two are also interesting.

However, this can be tricky to get right and classical statistical methods (ETS, ARIMA) are still highly performant (and easier to implement).
Perhaps it could be worth starting with these simpler methods for a baseline before trying for the more complex booster (or neural) models.
It is probably worth trying the cloud services like AWS Forecast as well but the trade-off is flexibility of the code.

## Table of contents
- [Forecasting literature review](#forecasting-literature-review)
  - [Table of contents](#table-of-contents)
  - [Publications](#publications)
    - [M5 accuracy competition: Results, findings, and conclusions (2022)](#m5-accuracy-competition-results-findings-and-conclusions-2022)
    - [The M5 uncertainty competition: Results, findings and conclusions (2022)](#the-m5-uncertainty-competition-results-findings-and-conclusions-2022)
    - [Recurrent Neural Networks for Time Series Forecasting: Current status and future directions (2020)](#recurrent-neural-networks-for-time-series-forecasting-current-status-and-future-directions-2020)
    - [Forecasting at Scale (2018)](#forecasting-at-scale-2018)
    - [Forecast Evaluation for Data Scientists: Common Pitfalls and Best Practices (2022)](#forecast-evaluation-for-data-scientists-common-pitfalls-and-best-practices-2022)
  - [Services](#services)
    - [AWS](#aws)
    - [Microsoft](#microsoft)


## Publications

### M5 accuracy competition: Results, findings, and conclusions (2022)  
Spyros Makridakis (h:59), Evangelos Spiliotisa (h:19), Vassilios Assimakopoulosa (h:27)  
International Journal of Forecasting (h:100)  
https://www.sciencedirect.com/science/article/pii/S0169207021001874

* M5 is an international forecasting competition (well-respected in the academic forecasting community) run in 2020 to find the best forecasting practices. It's run for almost 40 years but more recently modern ML approaches have begun to dominate (vs ETS/ARIMA even just a few years ago)
* The forecast was on retail sales data - volume forecasting so not radically dissimilar to the PEXA problem.
* LightGBM was used by basically all top competitors as the most accurate model
* Methods like ETS were still competitive and have the advantage of being far cheaper (to implement and computationally)
* Less than half of participants beat the naive benchmark, and only 7.5% beat the exponential smoothing benchmark, highlighting how difficult forecasting can be especially when trying to build complex models.
* It may be worth directly reading the methodology of the top five winning teams to understand how they implemented their LightGBM models
* Worth noting the most recent copy of the IJF is entirely dedicated to the results of the M5 competition.

<br>

### The M5 uncertainty competition: Results, findings and conclusions (2022)   
Spyros Makridakis (h:59), Evangelos Spiliotisa (h:19), Vassilios Assimakopoulosa (h:27) et al.  
International Journal of Forecasting (h:100)  
https://www.sciencedirect.com/science/article/pii/S0169207021001874

* While accuracy is treated as a gold standard, uncertainty can be just as important in forecasting to quantify not just a point estimate but also probabilistic ranges.
* Like for accuracy LightGBM was a popular model choice, although LSTMs also appeared frequently amongst the top performing teams, and 6th place interestingly used a model trained using Monte Carlo simulations on a negative binomial distribution.
* About 10% of entrants improved upon the ARIMA benchmark

<br>

### Recurrent Neural Networks for Time Series Forecasting: Current status and future directions (2020)  
Hansika Hewamalage (h:7), Christoph Bergmeir (h:26), Kasun Bandara (h:9)  
International Journal of Forecasting (h:100)  
https://www.sciencedirect.com/science/article/pii/S0169207020300996  

* Emphasises that classical statistical techniques like ARIMA and ETS are still accurate, robust and simple to use.
* Traditionalists have been averse and skeptical of RNN methods but this is shifting
* Conclude that RNNs (especially LSTM) have developed to a point of being a good option and worth trying and comparing against traditional methods.
* Underexplored are CNNs, which although traditionally used for image problems, have become increasingly promising due to their ability to effectively capture seasonality patterns (See future directions of paper).

<br>

### Forecasting at Scale (2018)  
Sean J. Taylor (h:10) & Benjamin Letham (h:9)
The American Statistician (h:86)
https://doi.org/10.1080/00031305.2017.1380080

* The paper that introduces the decomposable time series Prophet model
* It is still being regularly updated (new releases every ~3 months) with the latest version updated Sep 2022
* Has the advantage of being very easy to implement with little technical knowledge required (_at scale_ in the title refers to more practitioners being able to forecast)

<br>

### Forecast Evaluation for Data Scientists: Common Pitfalls and Best Practices (2022)  
Hansika Hewamalage (h:7), Klaus Ackermann (h:6), Christoph Bergmeir (h:26)  
https://arxiv.org/abs/2203.10716 (free)

* Useful for seeing what evaluation metrics may be best (given the limitations and assumptions of the time series data you are working with)
* tsCV in R is identified as the most relevant procedure (there appears to be equivalents in Python)
* Might be useful to help construct business case or arguments for a particular chosen method.

<br>

## Services

### AWS
* AWS Forecast is a service which effectively has AWS trial six different forecasting methods (CNN, RNN, Prophet, NPTS, ARMIA and ETS) and take the best performer. 
* Unfortunately bit of a black box so you appear to have limited ability to change what is happening or change parameters (although it may be better here than it seems)
* https://aws.amazon.com/forecast/
* https://github.com/aws-samples/amazon-forecast-samples

<br>

### Microsoft
* Provides example notebooks for various methods such as LightGBM, Auto ARIMA and DilatedCNN (as mentioned above it is promising especially where RNNs can run into seasonality issues)
* Unfortunately hasn't been updated since mid-2020 so may not incorporate past ~1-2 years of learning
* https://github.com/microsoft/forecasting