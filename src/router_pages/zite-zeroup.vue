<template>
	<div id="ZiteZeroUp" class="container">
		<div class="row">
	        <div class="col s12 m12 l8 push-l2">
				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
					<form onsubmit="return false;">
						<div class="input-field">
						<input id="search" type="search" placeholder="Search ZeroUp" v-on:input.prevent="getResults" v-on:keyup.enter="searchEnter($event)" v-model="searchQuery" required>
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
                            <a :href="result.dllink">{{ result.title }}</a>
                        </span>
                        <div>
                            Uploaded by {{ result.cert_user_id }} | {{ result.directory.replace(/users\//, "").replace(/\//g, "") }}<br>
                            File Size: {{ result.filesize }} MB, Date Uploaded: {{ result.filedate.toLocaleString() }}
                        </div>
                        <small>{{ result.file_name }}</small>
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
		name: "ZiteZeroUp",
		data: () => {
			return {
                //categoriesSidebar: categoriesSidebar,
                loading: true,
                db: null,
                results: [],
                searchQuery: "",
				pageNum: 0,
				searchQuery: ""
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
            getCorsAndDb: function() {
                var self = this;
                if(page.siteInfo.settings.permissions.indexOf("Cors:1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc") < 0) {
                    page.cmd("corsPermission", "1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc", function() {
                        page.cmd("fileGet",
                        {
                            "inner_path": 'cors-1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc/data/users/zeroup.db',
                            "format": 'base64'
                            }, function(data) {
                                self.loading = false;
                                var uIntuArray = new Uint8Array(Base64Binary.decodeArrayBuffer(data));
                                self.db = new SQL.Database(uInt8Array);
                                //fetchfromdb(searchterm)
                                self.getResults();
                            });
                        });
                } else {
                    page.cmd("fileGet", {
                            "inner_path": 'cors-1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc/data/users/zeroup.db',
                            "format": 'base64'
                        }, function(data) {
                            self.loading = false;
                            var uInt8Array = new Uint8Array(Base64Binary.decodeArrayBuffer(data));
                            self.db = new SQL.Database(uInt8Array);
                            //fetchfromdb(searchterm)
                            self.getResults();
                        });
                }
            },
            getResults: function() {
                var self = this;

                var query = searchDbQuery(page, self.searchQuery, {
                    orderByScore: true,
                    id_col: "date_added",
                    select: "*",
                    searchSelects: [
                        { col: "title", score: 5 },
                        { col: "file_name", score: 4 },
                        { col: "cert_user_id", score: 3, usingJson: true },
                        //{ col: "directory", score: 2 },
                        { col: "date_added", score: 1 }
                    ],
                    table: "file",
                    join: "LEFT JOIN json USING (json_id)",
                    page: self.pageNum,
                    afterOrderBy: "date_added DESC",
                    limit: 12
                });

                var files = self.db.exec(query);

                self.results = [];
                for (var i = 0; i < files[0].values.length; i++) {
                    var result = {};
                    for (var j = 0; j < files[0].columns.length; j++) {
                        if (files[0].columns[j] == "file_name") {
                            if (j != 0) continue; // Skip filename of data file
                        }
                        result[files[0].columns[j]] = files[0].values[i][j];
                    }
                    result["dllink"] = "/1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc/data/users/"+result.directory+"/"+result.file_name;
                    result["filesize"] = (result.size/1024/1024).toFixed(2);
                    result["filedate"] = new Date(result.date_added*1000);
                    self.results.push(result);
                }
            },
			previousPage: function() { // TODO: Scroll to top
				this.pageNum -= 1;
				if (this.pageNum <= 0) this.pageNum = 0;
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
			}
		}
	}
</script>
