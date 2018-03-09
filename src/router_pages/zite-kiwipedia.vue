<template>
	<div id="ZiteKiwipedia" class="container">
		<div class="row">
	        <div class="col s12 m12 l8 push-l2">
				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
					<form onsubmit="return false;">
						<div class="input-field">
						<input id="search" type="search" placeholder="Search Kiwipedia (On Enter)" v-on:keyup.enter="searchEnter" v-model="searchQuery" required>
						<label class="label-icon" for="search"><i class="material-icons">search</i></label>
						<i class="material-icons" v-on:click.prevent="clearSearch()">close</i>
						</div>
					</form>
					</div>
				</nav>

				<!--<ul class="pagination center-align" v-if="zites.length >= 4">
					<li><a href="#!" v-on:click.prevent="previousPage"><i class="material-icons">chevron_left</i></a></li>
					<li class="disabled"><a href="#!">{{ pageNum + 1 }}</a></li>
					<li><a href="#!" v-on:click.prevent="nextPage"><i class="material-icons">chevron_right</i></a></li>
				</ul>-->

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

                <div class="card" v-for="result in results" v-if="result.title != ''">
                    <div class="card-content">
                        <span class="card-title" style="margin-bottom: 0;">
                            <a :href="getLink(result)">{{ result.title }}</a>
                        </span>
                        <small>
                            Last updated by {{ result.cert_user_id }} | {{ result.directory.replace(/17FjMvAGAWAHxUohzk5HEq5EgjoCXnXV19\/data\/users\//, "").replace(/\//g, "") }} <br>
                        </small>
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
	        	<component :is="categoriesSidebar" :categories="categories"></component>
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	//var categoriesSidebar = require("../vue_components/categories.vue");
    var ziteListItem = require("../vue_components/zite_list_item.vue");
    var SQL = require('sql.js');
    var Base64Binary = require("../libs/base64-binary");
    var searchDbQuery = require("../libs/search.js");

	module.exports = {
		props: ["userInfo"],
		name: "ZiteKiwipedia",
		data: () => {
			return {
                loading: true,
                results: [],
                searchQuery: "",
				pageNum: 0,
                searchQuery: "",
                address: "1KiwiBCVBUcuypVm8FEmUW9YT6fJDXkN9r",
                dbfile: "Kiwipedia.db"
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
            getLink: function(result) {
                return "/" + this.address + "/?/wiki/en/" + result.slug;
            },
            getCorsAndDb: function() {
                var self = this;
                if(page.siteInfo.settings.permissions.indexOf("Cors:" + self.address) < 0) {
                    page.cmd("corsPermission", self.address, function() {
                        page.cmd("fileGet",
                        {
                            "inner_path": 'cors-' + self.address + '/' + self.dbfile,
                            "format": 'base64'
                            }, function(data) {
                                //var uIntuArray = new Uint8Array(Base64Binary.decodeArrayBuffer(data));
                                //db = new SQL.Database(uInt8Array);
                                //fetchfromdb(searchterm)
                                self.getResults();
                            });
                        });
                } else {
                    page.cmd("fileGet", {
                            "inner_path": 'cors-' + self.address + '/' + self.dbfile,
                            "format": 'base64'
                        }, function(data) {
                            //var uInt8Array = new Uint8Array(Base64Binary.decodeArrayBuffer(data));
                            //db = new SQL.Database(uInt8Array);
                            //fetchfromdb(searchterm)
                            self.getResults();
                        });
                }
            },
            getResults: function() {
                var self = this;

                var query = searchDbQuery(page, self.searchQuery, {
                    orderByScore: true,
                    id_col: "slug",
                    select: "article.title, article.text, article.slug, MAX(article.date_updated) AS date_updated, article.imported, article.json_id, json.cert_user_id, json.directory",
                    searchSelects: [
                        { col: "title", score: 5 },
                        { col: "cert_user_id", score: 4, usingJson: true },
                        //{ col: "slug", score: 4 },
                        { col: "text", score: 3 },
                        //{ col: "directory", score: 2, usingJson: true },
                        //{ col: "date_updated", score: 1 }
                    ],
                    table: "article",
                    join: "LEFT JOIN json USING (json_id)",
                    where: "json.site = 'merged-Kiwipedia' AND json.directory LIKE '17FjMvAGAWAHxUohzk5HEq5EgjoCXnXV19/%'", // Only support En hub
                    page: self.pageNum,
                    //afterOrderBy: "date_updated DESC",
                    groupBy: "article.slug",
                    limit: 8
                });

                page.cmd("as", [self.address, "dbQuery", [query]], function(results) {
                    self.results = results;
                    //console.log(results);
                    self.loading = false;
                });

                //var files = db.exec(query);

                /*if (files.length == 0 && self.pageNum != 0) {
                    self.pageNum--;
                    //self.getResults();
                    return;
                }*/

                //console.log(files);

                /*self.results = [];
                for (var i = 0; i < files[0].values.length; i++) {
                    var result = {};
                    for (var j = 0; j < files[0].columns.length; j++) {
                        result[files[0].columns[j]] = files[0].values[i][j];
                    }
                    self.results.push(result);
                }*/
            },
			previousPage: function() { // TODO: Scroll to top
				this.pageNum -= 1;
				if (this.pageNum < 0) {
                    this.pageNum = 0;
                    return;
                }
                this.results = [];
                this.loading = true;
				this.getResults();
			},
			nextPage: function() {
				this.pageNum += 1;
                this.results = [];
                this.loading = true;
				this.getResults();
            },
			clearSearch: function() {
				this.searchQuery = "";
                this.results = [];
                this.loading = true;
				this.getResults();
			},
			searchEnter: function(e) {
                this.results = [];
                this.loading = true;
                this.getResults();
			}
		}
	}
</script>

