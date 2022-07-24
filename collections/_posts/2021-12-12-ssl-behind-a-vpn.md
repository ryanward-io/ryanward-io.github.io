---
layout: post
title: Dealing with SSL errors in Requests behind a VPN
date: 2021-12-12
summary: As with most things, understanding the cause helps avoid headaches.
categories: python security
---

I’ve recently had to tackle the issue of using Python’s Requests library to access the internet behind a corporate Virtual Private Network (VPN).

I was surprised that while the problem was documented widely (e.g. here from [StackOverflow](https://stackoverflow.com/questions/10667960/python-requests-throwing-sslerror)), good solutions were hard to come by.

### The problem

An illustration of the problem might be:

```python
import requests
requests.get('https://fromlawtodata.com')

Traceback (most recent call last):
...
requests.exceptions.SSLError:
HTTPSConnectionPool(host='fromlawtodata.com', port=443):
Max retries exceeded with url: /
(Caused by SSLError(SSLCertVerificationError(1,
'[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed:
self signed certificate in certificate chain (\_ssl.c:1129)')))
```

As the traceback shows, the error is caused by a self-signed certificate.

The requests library uses a standard certificate authority which will contain SSL certificates for most websites so this is often never an issue. This is what is used by default with `requests.get(url, verify=True)`.

The issue arises as a VPN essentially acts as a man-in-the-middle to any request made between your computer/server and the world. When the requests library checks the chain of certificates from the server you are attempting to reach (e.g. ‘https://fromlawtodata.com’) to intermediate certificates, and finally to the root authority, it encounters a certificate it cannot verify – the self-signed certificate.

Therefore an error is thrown as verification failed and the request never resolves.

### How can we fix it?

There are two options.

The first is lazy and leaves one vulnerable to criminals reading or modifying information being sent between your computer and the requested server. It simply is disabling SSL verification by setting verify = False. There is no good reason to do this although this was the most common and accepted answer on Stack Overflow.

The second involves providing the self-signed certificate to requests so it can verify that link in the chain. Practically, this can be done by downloading the root certificate when you are behind a VPN from Chrome or Firefox in Base64 format, and directing the request to use that certificate. Below are instructions for Chrome but it should be similar for other browsers.

1. Once behind your VPN, go to your Chrome browser and click the lock symbol.

2. Click `Connection is Secure` and `Certificate is Valid`. You should get a pop-up of the certificate.

3. Go to Certification Path and select the top-level root authority which will be your self-signed certificate. Click `View Certificate`.

4. Go to details and click `Copy to File...`.

5. You’ll be taken to a Certificate Export Wizard. Click next and choose `Base-64 encoded` before clicking next again.

6. Name your certificate something relevant like `VPNb64.cer` and save in the same location you are running your requests script.

7. Now all you need to do is write:

```python
# Assuming certificate is in same dir as the script
ca = "VPNb64.cer"
requests.get(url, verify=ca)
```

If you go in and out of being behind the VPN which can happen you might want to do something like:

```python
ca = "VPNb64.cer"
try:
    requests.get(url)
except requests.exceptions.SSLError:
    requests.get(url, verify=ca)
```

Either way, no need to set `verify=False` and compromise your security.

A bit more work to set up but much more sustainable.
