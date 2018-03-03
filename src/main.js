version = "0.1"
ziteLanguages = [
	"EN", "ES", "EO", "RU"
]

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
var searchDbQuery = require("./libs/search.js");

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
			console.log(this.siteInfo);
            if (this.siteInfo == null || this.siteInfo.cert_user_id == null) {
                this.userInfo = null;
				this.$emit("setuserinfo", this.userInfo);
				this.$emit("update");
                return;
            }

            var that = this;

            that.userInfo = {
				privatekey: that.siteInfo.privatekey,
                cert_user_id: that.siteInfo.cert_user_id,
                auth_address: that.siteInfo.auth_address//,
                //keyvalue: keyvalue
            };
			that.$emit("setuserinfo", that.userInfo);
			that.$emit("update");
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
	
	getMergerCategoryNames() {
		var query = `
			SELECT DISTINCT merger_category FROM zites
			`;
		return page.cmdp("dbQuery", [query]);
	}

	getCategories() {
		var query = `
			SELECT * FROM categories
			`;
		return page.cmdp("dbQuery", [query]);
	}

	getZite(auth_address, id) {
		var query = `
			SELECT *
				${app.userInfo && app.userInfo.auth_address ? ", (" + this.subQueryBookmarks() + ")" : ""}
			FROM zites
			LEFT JOIN json USING (json_id)
			WHERE id=${id} AND json.directory='users/${auth_address}'
			LIMIT 1
			`;
		return page.cmdp("dbQuery", [query]);
	}

	getZiteByAddress(address) {
		var query = `
			SELECT *
			FROM zites
			LEFT JOIN json USING (json_id)
			WHERE address='${address}'
			LIMIT 1
			`;
		return page.cmdp("dbQuery", [query]);
	}

	getZites(pageNum = 0, limit = 8) {
		const offset = pageNum * limit;
		var query = `
			SELECT *
				${app.userInfo && app.userInfo.auth_address ? ", " + this.subQueryBookmarks() : ""}
			FROM zites
			LEFT JOIN json USING (json_id)
			LIMIT ${limit}
			OFFSET ${offset}
			`;
		return page.cmdp("dbQuery", [query]);
	}

	getZitesInCategory(categorySlug, pageNum = 0, limit = 8) {
		const offset = pageNum * limit;
		var query = `
			SELECT *
				${app.userInfo && app.userInfo.auth_address ? ", " + this.subQueryBookmarks() : ""}
			FROM zites
			LEFT JOIN json USING (json_id)
			WHERE category_slug="${categorySlug}"
			LIMIT ${limit}
			OFFSET ${offset}
			`;
		return page.cmdp("dbQuery", [query]);
	}

	getBookmarkZites(pageNum = 0, limit = 8) {
		const offset = pageNum * limit;
		var query = `
			SELECT *
				${app.userInfo && app.userInfo.auth_address ? ", " + this.subQueryBookmarks() : ""}
			FROM zites
				${app.userInfo && app.userInfo.auth_address ? "WHERE bookmarkCount >= 1" : ""}
			LEFT JOIN json USING (json_id)
			LIMIT ${limit}
			OFFSET ${offset}
			`;
		return page.cmdp("dbQuery", [query]);
	}

	subQueryBookmarks() {
		if (!app.userInfo || !app.userInfo.auth_address) {
			return "";
		}
		var s = `
			SELECT DISTINCT COUNT(*) FROM bookmarks LEFT JOIN json AS bookmarksjson USING (json_id) WHERE zites.id=bookmarks.reference_id AND bookmarksjson.directory='users/${app.userInfo.auth_address}'
			`;
		return s;
	}

	// TODO: Username/id at multiplication of 1
	getZitesSearch(searchQuery, pageNum = 0, limit = 8) {
		var query = searchDbQuery(this, searchQuery, {
			orderByScore: true,
			id_col: "id",
			select: "*",
			searchSelects: [
				{ col: "title", score: 5 },
				{ col: "domain", score: 5 },
				{ col: "address", score: 5 },
				{ col: "tags", score: 4 },
				{ col: "category_slug", score: 4 },
				{ col: "merger_category", score: 4 },
				{ col: "creator", score: 3 },
				{ col: "description", score: 2 },
				{ skip: !app.userInfo || !app.userInfo.auth_address, col: "bookmarkCount", select: this.subQueryBookmarks(), inSearchMatchesAdded: false, inSearchMatchesOrderBy: true, score: 6 } // TODO: Rename inSearchMatchesAdded, and isSearchMatchesOrderBy
			],
			table: "zites",
			join: "LEFT JOIN json USING (json_id)",
			page: pageNum,
			limit: limit
		});
		return this.cmdp("dbQuery", [query]);
	}

	getZitesInCategorySearch(categorySlug, searchQuery, pageNum = 0, limit = 8) {
		var query = searchDbQuery(this, searchQuery, {
			orderByScore: true,
			id_col: "id",
			select: "*",
			searchSelects: [
				{ col: "title", score: 5 },
				{ col: "domain", score: 5 },
				{ col: "address", score: 5 },
				{ col: "tags", score: 4 },
				{ col: "category_slug", score: 4 },
				{ col: "merger_category", score: 4 },
				{ col: "creator", score: 3 },
				{ col: "description", score: 2 },
				{ skip: !app.userInfo || !app.userInfo.auth_address, col: "bookmarkCount", select: this.subQueryBookmarks(), inSearchMatchesAdded: false, inSearchMatchesOrderBy: true, score: 6 } // TODO: Rename inSearchMatchesAdded, and isSearchMatchesOrderBy
			],
			table: "zites",
			where: "category_slug='" + categorySlug + "'",
			join: "LEFT JOIN json USING (json_id)",
			page: pageNum,
			limit: limit
		});
		return this.cmdp("dbQuery", [query]);
	}


	getMyZitesSearch(searchQuery, pageNum = 0, limit = 8) {
		if (!this.siteInfo.cert_user_id) {
    		return this.cmdp("wrapperNotification", ["error", "You must be logged in to see your zites."]);
		}

		var query = searchDbQuery(this, searchQuery, {
			orderByScore: true,
			id_col: "id",
			select: "*",
			searchSelects: [
				{ col: "title", score: 5 },
				{ col: "domain", score: 5 },
				{ col: "address", score: 5 },
				{ col: "tags", score: 4 },
				{ col: "category_slug", score: 4 },
				{ col: "merger_category", score: 4 },
				{ col: "creator", score: 3 },
				{ col: "description", score: 2 },
				{ skip: !app.userInfo || !app.userInfo.auth_address, col: "bookmarkCount", select: this.subQueryBookmarks(), inSearchMatchesAdded: false, inSearchMatchesOrderBy: true, score: 6 } // TODO: Rename inSearchMatchesAdded, and isSearchMatchesOrderBy
			],
			table: "zites",
			where: "directory='users/" + app.userInfo.auth_address + "'",
			join: "LEFT JOIN json USING (json_id)",
			page: pageNum,
			limit: limit
		});
		return this.cmdp("dbQuery", [query]);
	}

	getBookmarkZitesSearch(searchQuery, pageNum = 0, limit = 8) {
		if (!this.siteInfo.cert_user_id) {
    		return this.cmdp("wrapperNotification", ["error", "You must be logged in to see your bookmarks."]);
		}
		
		var query = searchDbQuery(this, searchQuery, {
			orderByScore: true,
			id_col: "id",
			select: "*",
			searchSelects: [
				{ col: "title", score: 5 },
				{ col: "domain", score: 5 },
				{ col: "address", score: 5 },
				{ col: "tags", score: 4 },
				{ col: "category_slug", score: 4 },
				{ col: "merger_category", score: 4 },
				{ col: "creator", score: 3 },
				{ col: "description", score: 2 },
				{ skip: !app.userInfo || !app.userInfo.auth_address, col: "bookmarkCount", select: this.subQueryBookmarks(), inSearchMatchesAdded: false, inSearchMatchesOrderBy: false, score: 6 } // TODO: Rename inSearchMatchesAdded, and isSearchMatchesOrderBy
			],
			table: "zites",
			where: app.userInfo && app.userInfo.auth_address ? "bookmarkCount >= 1" : "",
			join: "LEFT JOIN json USING (json_id)",
			page: pageNum,
			limit: limit
		});
		return this.cmdp("dbQuery", [query]);
	}

	// merger_supported :: bool
	addZite(title, address, domain, creator, description, tags, category_slug, merger_supported, merger_category, languages, beforePublishCB) {
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

				address = address.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\/$/g, "");
				domain = domain.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\/$/g, "");
				title = title.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\.bit/g, "").replace(/(#.*|\?.*)/g, "").replace(/\/$/g, "");
				merger_category = merger_category.replace(/(merged|merger)-/g, "");
				creator = creator.replace(/(.)@.*$/g, "$1");

				languages = languages.replace(/\s/g, "");

    			data["zites"].push({
    				"id": date,
					"title": title.trim(),
					"address": address.trim(),
					"domain": domain.trim(),
					"creator": creator,
					"slug": slug.trim(),
					"description": description.trim(),
					"category_slug": category_slug,
					"tags": tags.trim(),
					"merger_supported": merger_supported,
					"merger_category": merger_category.trim(),
					"languages": languages,
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

	editZite(id, title, address, domain, creator, description, tags, category_slug, merger_supported, merger_category, languages, beforePublishCB) {
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
					console.log("Error!");
					return;
    			}

    			if (!data["zites"]) {
					console.log("Error!");
					return;
				}

				var date = Date.now();
				
				var slug = title.toLowerCase().replace(/\s*/g, "_").replace(/(\.|\:)/g, "-").replace(/[^a-zA-Z0-9-]/g, "");

				address = address.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\/$/g, "");
				domain = domain.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\/$/g, "");
				title = title.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\.bit/g, "").replace(/(#.*|\?.*)/g, "").replace(/\/$/g, "");
				merger_category = merger_category.replace(/(merged|merger)-/g, "");
				creator = creator.replace(/(.)@.*$/g, "$1");

				languages = languages.replace(/\s/g, "");

				for (var i in data["zites"]) {
					var zite = data["zites"][i];
					if (zite.id == id) {
						data["zites"][i].title = title.trim();
						data["zites"][i].address = address.trim();
						data["zites"][i].domain = domain.trim();
						data["zites"][i].creator = creator.trim();
						data["zites"][i].slug = slug.trim();
						data["zites"][i].description = description.trim();
						data["zites"][i].category_slug = category_slug;
						data["zites"][i].tags = tags.trim();
						data["zites"][i].merger_supported = merger_supported;
						data["zites"][i].merger_category = merger_category.trim();
						data["zites"][i].languages = languages.trim();
						data["zites"][i].date_updated = date;
						break;
					}
				}

    			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

    			return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)])
					.then((res) => {
		    			if (res === "ok") {
		    				return self.cmdp("siteSign", { "inner_path": content_inner_path })
		    					.then((res) => {
		    						if (res === "ok") {
		    							if (beforePublishCB != null && typeof beforePublishCB === "function") beforePublishCB({ "id": id, "auth_address": self.siteInfo.auth_address });
		    							return self.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": false })
		    								.then(() => {
		    									return { "id": id, "auth_address": self.siteInfo.auth_address };
		    								}).catch((err) => {
                                                console.log(err);
                                                return { "id": id, "auth_address": self.siteInfo.auth_address, "err": err };
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

	deleteZite(id, beforePublishCB) {
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
					console.log("Error!");
					return;
    			}

    			if (!data["zites"]) {
					console.log("Error!");
					return;
				}

				var date = Date.now();
				
				for (var i in data["zites"]) {
					var zite = data["zites"][i];
					if (zite.id == id) {
						data["zites"].splice(i, 1);
						break;
					}
				}

    			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

    			return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)])
					.then((res) => {
		    			if (res === "ok") {
		    				return self.cmdp("siteSign", { "inner_path": content_inner_path })
		    					.then((res) => {
		    						if (res === "ok") {
		    							if (beforePublishCB != null && typeof beforePublishCB === "function") beforePublishCB({ "id": id, "auth_address": self.siteInfo.auth_address });
		    							return self.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": false })
		    								.then(() => {
		    									return { "id": id, "auth_address": self.siteInfo.auth_address };
		    								}).catch((err) => {
                                                console.log(err);
                                                return { "id": id, "auth_address": self.siteInfo.auth_address, "err": err };
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

	editZiteAdmin(auth_address, id, title, address, domain, creator, description, tags, category_slug, merger_supported, merger_category, languages, beforePublishCB) {
		if (!this.siteInfo.privatekey) {
    		return this.cmdp("wrapperNotification", ["error", "You must be an admin to edit this zite."]);
    	}

    	var data_inner_path = "data/users/" + auth_address + "/data.json";
    	var content_inner_path = "data/users/" + auth_address + "/content.json";

    	var self = this;
    	return this.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
    		.then((data) => {
    			data = JSON.parse(data);
    			if (!data) {
					console.log("Error!");
					return;
    			}

    			if (!data["zites"]) {
					console.log("Error!");
					return;
				}

				var date = Date.now();
				
				var slug = title.toLowerCase().replace(/\s*/g, "_").replace(/(\.|\:)/g, "-").replace(/[^a-zA-Z0-9-]/g, "");

				address = address.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\/$/g, "");
				domain = domain.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\/$/g, "");
				title = title.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\.bit/g, "").replace(/(#.*|\?.*)/g, "").replace(/\/$/g, "");
				merger_category = merger_category.replace(/(merged|merger)-/g, "");
				creator = creator.replace(/(.)@.*$/g, "$1");
				languages = languages.replace(/\s/g, "");

				for (var i in data["zites"]) {
					var zite = data["zites"][i];
					if (zite.id == id) {
						data["zites"][i].title = title.trim();
						data["zites"][i].address = address.trim();
						data["zites"][i].domain = domain.trim();
						data["zites"][i].creator = creator.trim();
						data["zites"][i].slug = slug.trim();
						data["zites"][i].description = description.trim();
						data["zites"][i].category_slug = category_slug;
						data["zites"][i].tags = tags.trim();
						data["zites"][i].merger_supported = merger_supported;
						data["zites"][i].merger_category = merger_category.trim();
						data["zites"][i].languages = languages.trim();
						data["zites"][i].date_updated = date;
						break;
					}
				}

    			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

    			return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)])
					.then((res) => {
		    			if (res === "ok") {
		    				return self.cmdp("siteSign", ["stored", content_inner_path])
		    					.then((res) => {
		    						if (res === "ok") {
		    							if (beforePublishCB != null && typeof beforePublishCB === "function") beforePublishCB({ "id": id, "auth_address": auth_address });
		    							return self.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": false })
		    								.then(() => {
		    									return { "id": id, "auth_address": auth_address };
		    								}).catch((err) => {
                                                console.log(err);
                                                return { "id": id, "auth_address": auth_address, "err": err };
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

	deleteZiteAdmin(auth_address, id, beforePublishCB) {
		if (!this.siteInfo.privatekey) {
    		return this.cmdp("wrapperNotification", ["error", "You must be an admin to edit this zite."]);
    	}

    	var data_inner_path = "data/users/" + auth_address + "/data.json";
    	var content_inner_path = "data/users/" + auth_address + "/content.json";

    	var self = this;
    	return this.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
    		.then((data) => {
    			data = JSON.parse(data);
    			if (!data) {
					console.log("Error!");
					return;
    			}

    			if (!data["zites"]) {
					console.log("Error!");
					return;
				}

				for (var i in data["zites"]) {
					var zite = data["zites"][i];
					if (zite.id == id) {
						data["zites"].splice(i, 1);
						break;
					}
				}

    			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

    			return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)])
					.then((res) => {
		    			if (res === "ok") {
		    				return self.cmdp("siteSign", ["stored", content_inner_path])
		    					.then((res) => {
		    						if (res === "ok") {
		    							if (beforePublishCB != null && typeof beforePublishCB === "function") beforePublishCB({ "id": id, "auth_address": auth_address });
		    							return self.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": false })
		    								.then(() => {
		    									return { "id": id, "auth_address": auth_address };
		    								}).catch((err) => {
                                                console.log(err);
                                                return { "id": id, "auth_address": auth_address, "err": err };
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

	addBookmark(reference_id, reference_auth_address, beforePublishCB) {
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

    			if (!data["bookmarks"]) {
					data["bookmarks"] = [];
				}

				var date = Date.now();

				data["bookmarks"].push({
					"id": date,
					"reference_id": reference_id,
					"reference_auth_address": reference_auth_address,
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

	removeBookmark(reference_id, reference_auth_address, beforePublishCB) {
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
					return; // TODO: Error!
    			}

    			if (!data["bookmarks"]) {
					return; // TODO: Error!
				}

				var date = Date.now();
				var keepLooping = true;
				while (keepLooping) {
					for (let i = 0; i < data["bookmarks"].length; i++) { // Go thorough whole list in case of duplicates
						var bookmark = data["bookmarks"][i];
						if (bookmark.reference_id == reference_id && bookmark.reference_auth_address == reference_auth_address) {
							if (i == data["bookmarks"].length - 1) {
								keepLooping = false;
							}
							data["bookmarks"].splice(i, 1);
							break;
						} else {
							if (i == data["bookmarks"].length - 1) {
								keepLooping = false;
							}
						}
					}
				}

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
var EditZite = require("./router_pages/edit-zite.vue");
var MyZites = require("./router_pages/my-zites.vue");
var MyBookmarks = require("./router_pages/my-bookmarks.vue");
var CategoryPage = require("./router_pages/categoryPage.vue");
var Admin = require("./router_pages/admin.vue");
var EditZiteAdmin = require("./router_pages/edit-zite-admin.vue");

VueZeroFrameRouter.VueZeroFrameRouter_Init(Router, app, [
	{ route: "admin/edit/:authaddress/:ziteid", component: EditZiteAdmin },
	{ route: "admin", component: Admin },
	{ route: "about", component: About },
	{ route: "my-bookmarks", component: MyBookmarks },
	{ route: "my-zites", component: MyZites },
	{ route: "edit-zite/:ziteid", component: EditZite },
	{ route: "add-zite", component: AddZite },
	{ route: "category/:categoryslug", component: CategoryPage },
	{ route: "", component: Home }
]);
