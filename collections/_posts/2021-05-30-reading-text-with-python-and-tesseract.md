---
layout: post
title: Reading text in images with Python and Tesseract
date: 2021-05-30
summary: This is just an intro to get you started.
categories: python ocr tesseract
---

Reading text from images is a classic task that machine learning can help with. One way to solve this is obtaining thousands (or millions) of images, labeling them, and then training a classification model (e.g. Random Forest).

However, not everyone has the time or resources to go and label a bunch of images. In these circumstances, using a pre-trained model can be far more effective and efficient.

One such model is an open source model called [Tesseract](https://github.com/tesseract-ocr/tesseract). This article will run through how to install it and start using it with Python (with Windows).

### Installing

1. Start by downloading the [Tesseract compiled engine](https://tesseract-ocr.github.io/tessdoc/Home.html). I am using the v5.0.0 binary in this article.
2. Once downloaded move the downloaded file to an easy to access folder. I put mine in `C:/Program Files/Tesseract-OCR/` so the executable is in `C:/Program Files/Tesseract-OCR/tesseract.exe`.
3. Now you need to install the relevant python libraries. There are just two (pandas is an optional third to put the parsed text in a structured place).

!pip install opencv-python
!pip install pytesseract
!pip install pandas

That’s it! Now you are ready to read some text.

### Analysing images

The first part of the code is importing libraries and pointing pytesseract to where the executable lives.

```python
import cv2
import pytesseract as pt

pt.pytesseract.tesseract_cmd = r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'
```

The helper function we’ll use to read an image before printing the result is very simple. It simple uses cv2 to read the image and then uses the image_to_string method in pytesseract to try and parse the image.

```python
def read_img(img):
    img = cv2.imread(img)
    return pt.image_to_string(img)
```

Tesseract works best with simpler fonts (i.e. sans-serif fonts), good resolution and minimal extraneous noise. Let’s explore a few images and their results.

#### Image one

![Picture of white rectangle with text - T Faix, https://unsplash.com/photos/eBkEJ9cH5b4](/images/posts/tesseract/image1.webp)

![OCR Output of first image showing text being read 100% accurately](/images/posts/tesseract/image1result.webp)

This worked perfect! How about another example with a bit more going on.

#### Image two

![Picture of sign with text of different fonts and sizes - M Zaric, https://unsplash.com/photos/trJjdYTRuNw](/images/posts/tesseract/image2.webp)

![OCR Output of second image showing text being read with mixed results](/images/posts/tesseract/image2result.webp)

Not as good as a result but it still picked up some things. It was happy with the sans-serif font giving the exact day it was coded and it saw the word CONSUME but not LESS, and also not the fancy font of CREATE MORE.

#### Image three

![Picture of old sign with stylised font starting with MEN WANTED - J Theodore, https://unsplash.com/photos/5UeasJVXLjA](/images/posts/tesseract/image3.webp)

![OCR Output of third image showing text being read with poor results](/images/posts/tesseract/image3result.webp)

Fairly mixed here. Considering the stylised font it’s done a decent job. It gets most of the first two lines. Completely misses the third line (perhaps because of the faint line through the line) and gets the fourth and fifth lines. The address in red at the bottom has a fair few errors though.

#### Image four

![Picture of text from book - A Spratt, https://unsplash.com/photos/askpr0s66Rg](/images/posts/tesseract/image4.webp)

![OCR Output of fourth image showing text being read with great results](/images/posts/tesseract/image4result.webp)

This is an example where tesseract does very well. Considering it is a cropped image of a page in a book, pretty much everywhere where it gets a full character or word it transcribes accurately. This reflects the image having words in a structured format, all similar size and with good contrast between the page and the text.

### Next steps

There are some things you can do to improve the output. Preprocessing images by converting to black and white, cropping out any unnecessary parts of the image and improving resolution (if possible) are all helpful.

Check out [my github repo](https://github.com/ryanward-io/ocr) for the code run in this article, as well as more techniques applied on a different dataset.
