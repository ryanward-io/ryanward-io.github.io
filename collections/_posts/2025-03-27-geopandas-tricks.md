---
layout: post
title: Geopandas beginner mistakes to learn from
date: 2025-03-27
summary: Get these concepts right to avoid a ton of errors
categories: geospatial
mathjax: true
---

GeoPandas has become my favourite tool for geospatial data manipulation in Python. However I encountered some pitfalls when starting out.

Here are a few of those issues and how to address them:

## 1. Coordinate Reference System (CRS) Mismatches  
One of the most frequent issues arises from Coordinate Reference Systems (CRS). Spatial joins or plotting might not work as expected due to CRS mismatches.

The easy solve is to always check and set the CRS explicitly.
You can look these up here: [https://epsg.io/](https://epsg.io/)

```python
# Set CRS when creating a GeoDataFrame
gdf = gpd.GeoDataFrame(df, geometry='geom_col', crs='EPSG:4326')

# Reproject to match another CRS
gdf = gdf.to_crs(other_gdf.crs)
```

## 2. Geographic vs Projected CRS for Australia
Understanding the difference between geographic and projected CRS is crucial for accurate spatial analysis.

Geographic CRS uses latitude and longitude in degrees. It's common for storing or sharing high-coverage data (e.g. all of Aus) but isn't suitable for measuring distances or areas as degrees are not uniform in size.

Projected CRS projects the earth onto a flat surface using metres. It's best for accurate local calculations like distance, area, and buffering. Australia uses [MGA zones](https://www.ga.gov.au/scientific-topics/positioning-navigation/positioning-australia/geodesy/datums-projections/grid2020) which split the continent into longitudinal strips for high accuracy.

Running spatial operations (like joins, area, or buffering) in a geographic CRS can produce misleading results (although Geopandas might warn you) - distances won’t be in metres, and areas may be wildly off.

**Geographic CRSs (Latitude/Longitude)**
- EPSG:4283 - GDA94 (Geocentric Datum of Australia 1994)
  - Used for legacy spatial datasets, still common systems, old ABS data, etc.
- EPSG:7844 - GDA2020 (Geocentric Datum of Australia 2020)
  - Modern standard for Australian geospatial data - improved accuracy.
- EPSG:4326 - WGS84 (Used globally)
  - Many datasets will come in this format, used widely for GPS, Leaflet, OpenStreetMap, etc

**Projected CRSs (metres)**
- EPSG:28350-28356 - zones 50-56
  - These are GDA94 MGA zones 
- EPSG:7850-7856 - zones 50-56
  - These are GDA2020 MGA zones
  - They move from left to right, e.g. zone 51 is just WA but zone 55 covers all of NSW, ACT, VIC and TAS
- EPSG:3577 - Australian Albers (GDA94)
  - Can be valuable for national analysis in metres where a bit of inaccuracy (e.g. >10 metres error) is fine.

Below is a comprehensive helper function for getting the right mga_zone for your longitude.

```python
def get_mga_zone(longitude, system='GDA94'):
    """Calculate the appropriate MGA Zone based on the longitude."""

    if not (112 <= longitude <= 155):
        raise ValueError("Longitude must be between 112°E and 155°E for Australian MGA zones.")
    
    zone_number = (longitude // 6) + 31  # Calculates zone number
    
    # Choose the appropriate EPSG prefix based on the datum
    if datum == 'GDA94':
        epsg_prefix = 'EPSG:283'
    elif datum == 'GDA2020':
        epsg_prefix = 'EPSG:78'
    else:
        raise ValueError("Invalid datum. Choose either 'GDA94' or 'GDA2020'.")

    epsg_code = f"{epsg_prefix}{zone_number}"  # Construct the EPSG code (e.g. EPSG:28355)
    return epsg_code

# Example:
longitude = 147  # For 147°E
mga_zone = get_mga_zone(longitude, 'GDA2020')
print(f"The MGA zone for {longitude}°E is {mga_zone}")
# >> The MGA zone for 147°E is 55
```

## 3. Reading data in WKB or WKT Format
Your data might not always be read in properly - don't let that trip you up.

If you read into a dataframe first for some reason the geometry might like this:
```01010000005839B4C876BEF33F1A3D70...```
or 
```'POLYGON ((147.0 -42.0,'```  

These are just binary and text formats respectively for storing geometry data.  

They can easily be fixed by calling ```gpd.GeoSeries.from_wkb()``` and ```gpd.GeoSeries.from_wkt()```.

An example of an all-in-one function which can check the geometry column and convert to a geodataframe is here:

```python
def convert_to_gdf(df, geom_col, crs="EPSG:7844"):
    if isinstance(df[geom_col], gpd.GeoSeries):
        gdf = gpd.GeoDataFrame(df, geometry=geom_col)
    else:
        try:
            df[geom_col] = gpd.GeoSeries.from_wkt(df[geom_col])
        except (ValueError, TypeError):
            df[geom_col] = gpd.GeoSeries.from_wkb(df[geom_col])

        gdf = gpd.GeoDataFrame(df, geometry=geom_col)

    if gdf.crs is None:
        gdf = gdf.set_crs(crs)  # Default sets to GDA2020 but would want to check

    return gdf
```

These are a couple of the issues I encountered when first working with GeoPandas.  
Hopefully these can save time and improve your analysis.