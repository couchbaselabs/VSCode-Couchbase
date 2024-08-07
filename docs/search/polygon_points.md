Set an array of latitude and longitude string values to use as the points in your polygon search area.

For example, an array of [ "37.79393211306212,-122.44234633404847", "37.77995881733997,-122.43977141339417", "37.788031092020155,-122.42925715405579"] is interpreted as 3 separate polygon points and creates a 3-sided polygon.

For **polygon_points**, the first value in the string is the latitude, and the second is the longitude.

You can set the last value in the array to the same value as the first latitude and longitude to explicitly close your polygon. Otherwise, the Search Service infers the polygon's closure.

→ [Polygon-Based Geopoint Query Documentation](https://docs.couchbase.com/server/current/search/search-request-params.html#geopoint-queries-polygon)