if [ $TRAVIS_TAG ]; then
  node ./scripts/write-config.js
  gem install iron_worker_ng
  iron_worker upload send-sms.worker --worker-config config.json
fi
