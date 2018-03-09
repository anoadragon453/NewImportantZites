<template>
	<div id="ZiteZeroList" class="container">
		<div class="row">
	        <div class="col s12 m12 l8 push-l2">
				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
					<form onsubmit="return false;">
						<div class="input-field">
						<input id="search" type="search" placeholder="Search 0List" v-on:input.prevent="getResults" v-on:keyup.enter="searchEnter($event)" v-model="searchQuery" required>
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

				<!--<component :is="zite_list_item" :user-info="userInfo" v-for="zite in zites" :zite="zite" :show-category="true" :categories="categories" v-on:update="getZites()"></component>-->

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
                            <a :href="getAddress(result)">{{ result.title }}</a>
                        </span>
                        <small>
                            Published by {{ result.directory.replace(/users\//, "").replace(/\//g, "") }} <em>| <a :href="getTopicUrl(result)">Goto 0List Topic</a> | <a href="#" v-on:click.prevent="importZite(result)">Import Into Important Zites</a></em>
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
		name: "ZiteZeroList",
		data: () => {
			return {
                loading: true,
                results: [],
                searchQuery: "",
				pageNum: 0,
                searchQuery: "",
                address: "186THqMWuptrZxq1rxzpguAivK3Bs6z84o",
                dbfile: "zerotalk.db"
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
                if(page.siteInfo.settings.permissions.indexOf("Cors:" + self.address) < 0) {
                    page.cmd("corsPermission", self.address, function() {
                        page.cmd("fileGet",
                        {
                            "inner_path": 'cors-' + self.address + '/data/users/' + self.dbfile,
                            "format": 'base64'
                            }, function(data) {
                                self.getResults();
                            });
                        });
                } else {
                    page.cmd("fileGet", {
                            "inner_path": 'cors-' + self.address + '/data/users/' + self.dbfile,
                            "format": 'base64'
                        }, function(data) {
                            self.getResults();
                        });
                }
            },
            getResults: function() {
                var self = this;

                var query = searchDbQuery(page, self.searchQuery, {
                    orderByScore: true,
                    id_col: "topic_id",
                    select: "*",
                    searchSelects: [
                        { col: "title", score: 5 },
                        { col: "body", score: 4 },
                        //{ col: "cert_user_id", score: 3, usingJson: true }, // 0list puts this in keyvalue instead of json table for some reason
                        //{ col: "directory", score: 2, usingJson: true },
                        { col: "added", score: 1 }
                    ],
                    table: "topic",
                    join: "LEFT JOIN json USING (json_id)",
                    page: self.pageNum,
                    afterOrderBy: "added DESC",
                    limit: 12
                });

                page.cmd("as", [self.address, "dbQuery", [query]], function(results) {
                    if (results.length == 0 && self.pageNum != 0) {
                        self.pageNum--;
                        return;
                    }
                    self.results = results;
                    console.log(results);
                    self.loading = false;
                });

                /*self.results = [];
                for (var i = 0; i < files[0].values.length; i++) {
                    var result = {};
                    for (var j = 0; j < files[0].columns.length; j++) {
                        result[files[0].columns[j]] = files[0].values[i][j];
                        if (files[0].columns[j] == "body") {
                            var matches = files[0].values[i][j].match(/https?\:\/\/127\.0\.0\.1\:43110\/[A-Za-z0-9\.]+/);
                            //console.log(matches);
                            if (matches) {
                                result["address"] = matches[0].replace(/https?\:\/\//g, "").replace(/127\.0\.0\.1/g, "").replace(/\:43110\/?/g, "").replace(/\//g, "");
                            }
                        }
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
				this.getResults();
			},
			nextPage: function() {
				this.pageNum += 1;
				this.getResults();
            },
			clearSearch: function() {
				this.searchQuery = "";
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
