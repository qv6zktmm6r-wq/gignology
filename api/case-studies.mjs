import {relayPublic} from '../server/vercel-relay.mjs';

export default {
  fetch(request) {
    return relayPublic(request, '/api/case-studies');
  },
};
