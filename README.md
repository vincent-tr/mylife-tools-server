# mylife-tools-server
MyLife Tools Server

 ## Build
  - npm update
  - npm version
  - git push && git push --tags
  - npm publish

## mylife common

### common
  - datatypes/entities
  - localization

### ui
  - material ui
  - editors
  - shared workers/offline ?
  - web socket -> dataview with update notifications
  - request/response on top of web socket
  - each tab = websocket
  - no offline mode
  - no service worker for now
  - routing
  - master layout
  - redux base
  - dialogs

### server
  - config management
  - docker
  - mongo
  - business
  - web api, session, websocket

## DATABASE
 - < 1 million record -> in memory store(cf node-dirty)
 - whole DB in memory
 - with freeze on each object => update = replace whole object
 - keep update history + version + tracability (ts + user)
 - event fired on update
 - collections
 - indexes (auto create on requests ?)
 - dataview with filters and event on change
