'use strict';

exports.createUnnotify = () => {
  const { unnotifyView } = require('../..');

  return (session, message) => {
    const { viewId } = message;
    return unnotifyView(session, viewId);
  };
};
