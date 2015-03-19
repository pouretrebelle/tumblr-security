tumblr-css-security
=================

A background service to authenticate theme purchases.

Will return false on hits from a banned purchase IDs. Otherwise it logs the hit. If any purchase ID is used by two or more usernames in a 24 hour period it'll email me with an option to ban the purchase. Pretty clever eh?

##To Do

- [ ] Modularise code into separate files, read a node style guide for this
- [ ] Save a log of loaded files before the log clears every day