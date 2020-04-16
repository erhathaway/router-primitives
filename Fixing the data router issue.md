Fixing the data router issue:

-   A data router is a router that is dependent on data
-   In reality the current data router should be called JsonDataRouter
-   If data doesnt exist the router should remain 'hidden'
-   When using 'linkTo' or showing a child router of a data router which has no data, the tree should terminate at the data router that has no data
-   Actions should return a location object, and a user errors array
-   The errors object should specify if a data router is missing data

All routers can have a `data` field.

-   In stack routers, the order is the data field

In router templates, an option to make the routing dependent on data can be set: isDependentOnData
This option means the router will only add data routers to the location if data exists

State in a router template describes the type of data. This should be changed to `Data` from `State`

TODO:

[x]. make flag on manager for either throwing an error if linking / navigating to path that has missing data or resolving to the nearest path that has no missing data
[x]. make template config `isDependentOnExternalData = true / false`
[x]. make router getter `data`
[x]. modify action args to support passing in data that data dependent routers can use if missing data (`pathData`)
[ ]. make actionStep that checks

-   if router is dependent on external data
-   if it is dependent check if there is data on the router or it was passed into the actions args
-   if not, set the context as missing dependent data and skip sibling / children / neighbor activation, instead keep passing to the parent until either there are no more data dependent routers that are missing data
