import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

const MINUTES = [1, 5, 15, 30, 60, 240];

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });
  app.use(SDKPlugin, sdk);

  const get_new_query = (query: string, mins: number) => {
    const timestamp = new Date(Date.now() - mins * 60000).toISOString();
    if (query.length === 0){
      return `req.created_at.gt:"${timestamp}"`;
    } else if (query.includes("req.created_at.gt")) {
      return query.replace(/req.created_at.gt:"[^"]*"/, `req.created_at.gt:"${timestamp}"`);
    } else {
      return `${query} and req.created_at.gt:"${timestamp}"`;
    }
  };

  for (const minutes of MINUTES) {
    if ((minutes / 60) < 1){
      var filter = `filter.${minutes}m`
    } else {
      var filter = `filter.${minutes/60}h`
    }
    sdk.commands.register(filter, {
      name: filter,
      group: "Filter",
      run: async () => {
        var query = get_new_query(sdk.httpHistory.getQuery(), minutes)
        sdk.httpHistory.setQuery(query);
      },
    });
    sdk.commandPalette.register(filter);
  }

  sdk.commands.register('editor.clear_search_bar', {
    name: 'Clear search bar',
    group: 'Editor',
    run: async() => {
      sdk.httpHistory.setQuery('');
    }
  });
  sdk.commandPalette.register('editor.clear_search_bar');

  const root = document.createElement("div");
  Object.assign(root.style, {
    height: "100%",
    width: "100%",
  });

  // Replace this with the value of the prefixWrap plugin in caido.config.ts
  root.id = `plugin--custom-caido`;
  app.mount(root);
  sdk.navigation.addPage("/custom-caido", {
    body: root,
  });
  sdk.sidebar.registerItem("Customizations", "/custom-caido", {icon: "fas fa-paw"});
};