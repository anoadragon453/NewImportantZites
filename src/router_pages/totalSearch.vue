<template>
	<div id="TotalSearch" class="container">
		<div class="row">
	        <div class="col s12 m12 l8 push-l2">
				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
					<form onsubmit="return false;">
						<div class="input-field">
						<input id="search" type="search" :placeholder="langTranslation['Total Search'] + ' (Important Zites, 0List, and ZeroSites)'" v-on:input.prevent="getResults" v-on:keyup.enter="searchEnter($event)" v-model="searchQuery" required>
						<label class="label-icon" for="search"><i class="material-icons">search</i></label>
						<i class="material-icons" v-on:click.prevent="clearSearch()">close</i>
						</div>
					</form>
					</div>
				</nav>

                <div class="preloader-wrapper small active" v-if="loading" style="position: fixed; left: 48%; top: 48%;">
                    <div class="spinner-layer spinner-green-only">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                    </div><div class="gap-patch">
                        <div class="circle"></div>
                    </div><div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                    </div>
                </div>

                <div class="card" v-for="result in results">
                    <div class="card-content">
                        <span class="card-title" style="margin-bottom: 0;">
                            <a :href="result.link">{{ result.title }}</a>
                        </span>
                        <p>{{ result.body || "" }}</p>
                        <!--<small>
                            {{ langTranslation["Published by ..."].replace(/\.\.\./, result.directory.replace(/users\//, "").replace(/\//g, "")) }} <em>| <a :href="getTopicUrl(result)">Goto 0List Topic</a> | <a href="#" v-on:click.prevent="importZite(result)">Import Into Important Zites</a></em>
                        </small>-->
                    </div>
                </div>

				<!-- TODO: Use getSearchResults when check for length once search has been implemented -->
				<ul class="pagination center-align" v-if="results.length != 0">
					<li><a href="#!" v-on:click.prevent="previousPage"><i class="material-icons">chevron_left</i></a></li>
					<li class="disabled"><a href="#!">{{ pageNum + 1 }}</a></li>
					<li><a href="#!" v-on:click.prevent="nextPage"><i class="material-icons">chevron_right</i></a></li>
				</ul>
	        </div>
	        <div class="col s12 m12 l3">
	        	<!--<component :is="categoriesSidebar" :categories="categories"></component>-->
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	//var categoriesSidebar = require("../vue_components/categories.vue");
    var ziteListItem = require("../vue_components/zite_list_item.vue");
    var searchDbQuery = require("../libs/search.js");

	module.exports = {
		props: ["userInfo", "langTranslation"],
		name: "TotalSearch",
		data: () => {
			return {
                loading: true,
                prevResults: [],
                results: [],
                zerolist_results: [],
                zerosites_results: [],
                zeroup_results: [],
                importantzites_results: [],
                searchQuery: "",
				pageNum: 0,
                searchQuery: "",
                totalCount: 3,
                currentCount: 0,
			}
		},
		beforeMount: function() {
			var self = this;

			if (Router.currentParams["page"])
                this.pageNum = parseInt(Router.currentParams["page"]);
            
            if (this.userInfo) {
                this.getCorsAndDb();
            }
            

			this.$parent.$on("update", function() {
                //self.getQuestions();
                self.getCorsAndDb();
			});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
            },
            getAddress: function(result) {
                var matches = result.body.match(/https?\:\/\/127\.0\.0\.1\:43110\/[A-Za-z0-9\.]+/);
                //console.log(matches);
                if (matches) {
                    return "/" + matches[0].replace(/https?\:\/\//g, "").replace(/127\.0\.0\.1/g, "").replace(/\:43110\/?/g, "").replace(/\//g, "");
                }
                return "#";
            },
            getTopicUrl: function(result) {
                var titleToUrl = result.title.replace(/[^A-Za-z0-9]/g, "+").replace(/[+]+/g, "+").replace(/[+]+$/, "");

                return '/' + this.address + '/?Topic:'  + result.topic_id + '_' + result.directory.replace(/users\//, '').replace(/\//g, '') + '/' + titleToUrl;
            },
            getCorsAndDb: function() {
                var self = this;
                this.pageNum = 0;
                /*if (page.siteInfo.settings.permissions.indexOf("Cors:" + self.address) < 0) {
                    page.cmd("corsPermission", self.address, function() {
                            self.getResults();
                        });
                } else {
                    self.getResults();
                }*/
                this.getResults();
            },
            getResults: function() {
                this.currentCount = 0;
                this.getResults_0List();
                this.getResults_ZeroSites();
                //this.getResults_ZeroUp();
                this.getResults_ImportantZites();
            },
            getResults_0List: function() {
                if (page.siteInfo.settings.permissions.indexOf("Cors:186THqMWuptrZxq1rxzpguAivK3Bs6z84o") < 0) {
                    this.totalCount--;
                    return;
                }
                var self = this;

                this.zerolist_results = [];
                var query = searchDbQuery(page, self.searchQuery, {
                    orderByScore: true,
                    id_col: "topic_id",
                    select: "*",
                    searchSelects: [
                        { col: "title", score: 5 },
                        { col: "body", score: 4 },
                        { col: "added", score: 1 }
                    ],
                    table: "topic",
                    join: "INNER JOIN json USING (json_id)",
                    page: self.pageNum,
                    afterOrderBy: "added DESC",
                    limit: 4
                });

                page.cmd("as", ["186THqMWuptrZxq1rxzpguAivK3Bs6z84o", "dbQuery", [query]], function(results) {
                    /*if (results.length == 0 && self.pageNum != 0) {
                        self.pageNum--;
                        self.results = self.prevResults;
                        self.loading = false;
                        return;
                    }*/
                    for (var i = 0; i < results.length; i++) {
                        self.zerolist_results.push({
                            "title": results[i].title,
                            "body": results[i].body,
                            "link": "",
                            "date_added": results[i].added,
                        });
                    }
                    //self.zerolist_results = results;
                    self.currentCount++;
                    if (self.currentCount >= self.totalCount) {
                        self.done();
                    }
                });
            },
            getResults_ZeroSites: function() {
                if (page.siteInfo.settings.permissions.indexOf("Cors:1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB") < 0) {
                    this.totalCount--;
                    return;
                }
                var self = this;

                this.zerosites_results = [];
                var query = searchDbQuery(page, self.searchQuery, {
                    orderByScore: true,
                    id_col: "site_id",
                    select: "*",
                    searchSelects: [
                        { col: "title", score: 5 },
                        { col: "address", score: 5 },
                        { col: "tags", score: 4 },
                        { col: "cert_user_id", score: 4, usingJson: true },
                        { col: "category", score: 4 },
                        { col: "language", score: 3 },
                        { col: "description", score: 2 }
                    ],
                    table: "site",
                    join: "INNER JOIN json USING (json_id)",
                    page: self.pageNum,
                    afterOrderBy: "date_added DESC",
                    limit: 4
                });

                page.cmd("as", ["1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB", "dbQuery", [query]], function(results) {
                    /*if (results.length == 0 && self.pageNum != 0) {
                        self.pageNum--;
                        self.results = self.prevResults;
                        self.loading = false;
                        return;
                    }*/
                    for (var i = 0; i < results.length; i++) {
                        self.zerosites_results.push({
                            "title": results[i].title,
                            "body": results[i].description,
                            "link": "/" + results[i].address,
                            "date_added": results[i].date_added,
                        });
                    }
                    //self.zerosites_results = results;
                    self.currentCount++;
                    if (self.currentCount >= self.totalCount) {
                        self.done();
                    }
                });
            },
            getResults_ZeroUp: function() {
                if (page.siteInfo.settings.permissions.indexOf("Cors:1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc") < 0) {
                    this.totalCount--;
                    return;
                }
                var self = this;

                this.zeroup_results = [];
                var query = searchDbQuery(page, self.searchQuery, {
                    orderByScore: true,
                    id_col: "date_added",
                    select: "*",
                    searchSelects: [
                        { col: "title", score: 5 },
                        { col: "file_name", score: 4 },
                        { col: "cert_user_id", score: 3, usingJson: true },
                        //{ col: "directory", score: 2, usingJson: true },
                        { col: "date_added", score: 1 }
                    ],
                    table: "file",
                    join: "INNER JOIN json USING (json_id)",
                    page: self.pageNum,
                    afterOrderBy: "date_added DESC",
                    limit: 3
                });

                page.cmd("as", ["1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc", "dbQuery", [query]], function(results) {
                    for (var i = 0; i < results.length; i++) {
                        self.zeroup_results.push({
                            "title": results[i].title,
                            "body": results[i].file_name,
                            "link": "",
                            "date_added": results[i].date_added,
                        });
                    }
                    self.currentCount++;
                    if (self.currentCount >= self.totalCount) {
                        self.done();
                    }
                });
            },
            getResults_ImportantZites: function() {
                var self = this;
                this.importantzites_results = [];
				page.getZitesSearch(this.searchQuery, this.pageNum, 4)
					.then((results) => {
						/*if (zites.length == 0 && self.pageNum != 0) {
							self.pageNum--;
							self.getZites();
							return;
						}*/
                        for (var i = 0; i < results.length; i++) {
                            self.importantzites_results.push({
                                "title": results[i].title,
                                "body": results[i].description,
                                "link": "/" + results[i].address,
                                "date_added": results[i].date_added,
                            });
                        }
                        self.currentCount++;
                        if (self.currentCount >= self.totalCount) {
                            self.done();
                        }
						//self.$emit("resultsChanged");
					});

            },
            done: function() {
                // Fill in results with everything sorted
                this.loading = false;
                var list = this.zerolist_results.concat(this.zerosites_results).concat(this.importantzites_results);

                // Get rid of duplicates
                var seenTitle = {};
                var seenLink = {};
                list = list.filter(function (item) {
                    return (seenTitle.hasOwnProperty(item.title) ? false : (seenTitle[item.title] = true)) && (seenLink.hasOwnProperty(item.link) ? false : (seenLink[item.link] = true));
                });

                this.results = list;
            },
			previousPage: function() { // TODO: Scroll to top
				this.pageNum -= 1;
				if (this.pageNum < 0) {
                    this.pageNum = 0;
                    return;
                }
                this.prevResults = this.results;
                this.results = [];
                this.loading = true;
				this.getResults();
			},
			nextPage: function() {
				this.pageNum += 1;
                this.prevResults = this.results;
                this.results = [];
                this.loading = true;
				this.getResults();
            },
			clearSearch: function() {
				this.searchQuery = "";
                this.prevResults = this.results;
                this.results = [];
                this.loading = true;
                this.pageNum = 0;
				this.getResults();
			},
			searchEnter: function(e) {
				page.cmd("wrapperOpenWindow", ["/" + this.zites[0].address]);
            },
            importZite: function(result) {
                this.$emit('import-zite', {
                    "title": result.title,
                    "address": this.getAddress(result)
                });
            }
		}
	}
</script>
