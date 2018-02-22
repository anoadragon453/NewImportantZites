version = "0.1"

var anime = require("animejs");
window.anime = anime;
var Materialize = require("materialize-css/dist/js/materialize.min.js");

var MarkdownIt = require("markdown-it");
md = new MarkdownIt({
	html: false,
	linkify: true
});

var ZeroFrame = require("./libs/ZeroFrame.js");
var Router = require("./libs/router.js");

var Vue = require("vue/dist/vue.min.js");

var VueZeroFrameRouter = require("./libs/vue-zeroframe-router.js");

var { sanitizeStringForUrl, sanitizeStringForUrl_SQL, html_substr, sanitizeHtmlForDb } = require("./util.js");

Vue.use(VueZeroFrameRouter.VueZeroFrameRouter);

// Vue Components
var Navbar = require("./vue_components/navbar.vue");

var app = new Vue({
	el: "#app",
	template: `<div>
			<component ref="navbar" :is="navbar" :user-info="userInfo"></component>
			<component ref="view" :is="currentView" v-on:get-user-info="getUserInfo()" :user-info="userInfo"></component>
		</div>`,
	data: {
		navbar: Navbar,
		currentView: null,
		siteInfo: null,
		userInfo: null
	},
	methods: {
		getUserInfo: function(f = null) {
            if (this.siteInfo == null || this.siteInfo.cert_user_id == null) {
                this.userInfo = null;
                return;
            }

            var that = this;

            that.userInfo = {
                cert_user_id: that.siteInfo.cert_user_id,
                auth_address: that.siteInfo.auth_address//,
                //keyvalue: keyvalue
            };
            that.$emit("setUserInfo", that.userInfo);
            if (f !== null && typeof f === "function") f();

            /*page.cmd("dbQuery", ["SELECT key, value FROM keyvalue LEFT JOIN json USING (json_id) WHERE cert_user_id=\"" + this.siteInfo.cert_user_id + "\" AND directory=\"users/" + this.siteInfo.auth_address + "\""], (rows) => {
                var keyvalue = {};

                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    
                    keyvalue[row.key] = row.value;
                }
                if (!keyvalue.name || keyvalue.name === "") {
                    return;
				}
				
				that.$emit("setUserInfo", that.userInfo); // TODO: Not sure if I need this if I can pass in a function callback instead
				if (f !== null && typeof f === "function") f();
            });*/
        }
	}
});

class ZeroApp extends ZeroFrame {
	onOpenWebsocket() {
		var self = this;

		this.cmdp("siteInfo", {})
			.then((siteInfo) => {
				self.siteInfo = siteInfo;
				app.siteInfo = siteInfo;
				app.getUserInfo();
			});
	}

	onRequest(cmd, message) {
		Router.listenForBack(cmd, message);
		if (cmd === "setSiteInfo") {
			this.siteInfo = message.params;
			app.siteInfo = message.params;
			app.getUserInfo();
		}

		if (message.params.event[0] === "file_done") {
			app.$emit("update");
		}
	}

	selectUser() {
		return this.cmdp("certSelect", { accepted_domains: ["zeroid.bit", "kaffie.bit", "cryptoid.bit", "peak.id"] });
    }

    signout() {
    	return this.cmdp("certSelect", { accepted_domains: [""] });
    }

    unimplemented() {
        return page.cmdp("wrapperNotification", ["info", "Unimplemented!"]);
	}
	
	getCategories() {
		var query = `
			SELECT * FROM categories
			`;
		return page.cmdp("dbQuery", [query]);
	}

	getZites() {
		var query = `
			SELECT * FROM zites
			LEFT JOIN json USING (json_id)
			`;
		return page.cmdp("dbQuery", [query]);
	}

	// merger_supported :: bool
	addZite(title, creator, description, tags, category_slug, merger_supported, merger_category, beforePublishCB) {
		if (!this.siteInfo.cert_user_id) {
    		return this.cmdp("wrapperNotification", ["error", "You must be logged in to add a zite."]);
    	}

    	var data_inner_path = "data/users/" + this.siteInfo.auth_address + "/data.json";
    	var content_inner_path = "data/users/" + this.siteInfo.auth_address + "/content.json";

    	var self = this;
    	return this.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
    		.then((data) => {
    			data = JSON.parse(data);
    			if (!data) {
    				data = {};
    			}

    			if (!data["zites"]) data["zites"] = [];

				var date = Date.now();
				
				var slug = title.toLowerCase().replace(/\s*/g, "_").replace(/(\.|\:)/g, "-").replace(/[^a-zA-Z0-9-]/g, "");

    			data["zites"].push({
    				"zite_id": date,
					"title": title,
					"creator": creator,
					"slug": slug,
					"description": description,
					"category_slug": category_slug,
					"tags": tags,
					"merger_supported": merger_supported,
					"merger_category": merger_category,
    				"date_added": date
    			});

    			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

    			return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)])
					.then((res) => {
		    			if (res === "ok") {
		    				return self.cmdp("siteSign", { "inner_path": content_inner_path })
		    					.then((res) => {
		    						if (res === "ok") {
		    							if (beforePublishCB != null && typeof beforePublishCB === "function") beforePublishCB({ "id": date, "auth_address": self.siteInfo.auth_address });
		    							return self.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": false })
		    								.then(() => {
		    									return { "id": date, "auth_address": self.siteInfo.auth_address };
		    								}).catch((err) => {
                                                console.log(err);
                                                return { "id": date, "auth_address": self.siteInfo.auth_address, "err": err };
                                            });
		    						} else {
		    							return self.cmdp("wrapperNotification", ["error", "Failed to sign user data."]);
		    						}
		    					});
		    			} else {
		    				return self.cmdp("wrapperNotification", ["error", "Failed to write to data file."]);
		    			}
		    		});
	    	});
	}
}

page = new ZeroApp();

var Home = require("./router_pages/home.vue");
var About = require("./router_pages/about.vue");
var AddZite = require("./router_pages/add-zite.vue");

VueZeroFrameRouter.VueZeroFrameRouter_Init(Router, app, [
	{ route: "about", component: About },
	{ route: "add-zite", component: AddZite },
	{ route: "", component: Home }
]);
