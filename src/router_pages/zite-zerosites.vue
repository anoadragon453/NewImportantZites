<template>
	<div id="ZiteZeroSites" class="container">
		<div class="row">
	        <div class="col s12 m12 l8 push-l2">
				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
					<form onsubmit="return false;">
						<div class="input-field">
						<input id="search" type="search" placeholder="Search ZeroSites" v-on:input="getResults" v-on:keyup.enter="searchEnter" v-model="searchQuery" required>
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
                            <a :href="'/' + result.address">{{ result.title }}</a>
                        </span>
                        <div>{{ result.description }}</div>
                        <small>
                            Published by {{ result.cert_user_id }} | {{ result.directory.replace(/users\//, "").replace(/\//g, "") }} <br>
                            <em><a :href="'#'" v-on:click.prevent="importZite(result)">Import Into Important Zites</a></em>
                        </small>
                    </div>
                </div>

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
    var searchDbQuery = require("../libs/search.js");

	module.exports = {
		props: ["userInfo"],
		name: "ZiteZeroSites",
		data: () => {
			return {
                loading: true,
                prevResults: [],
                results: [],
                searchQuery: "",
				pageNum: 0,
                searchQuery: "",
                address: "1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB",
                dbfile: "zerosites.db"
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
                self.getCorsAndDb();
			});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
            },
            getCorsAndDb: function() {
                var self = this;
                this.pageNum = 0;
                if(page.siteInfo.settings.permissions.indexOf("Cors:" + self.address) < 0) {
                    page.cmd("corsPermission", self.address, function() {
                        self.getResults();
                    });
                } else {
                    self.getResults();
                }
            },
            getResults: function() {
                var self = this;

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
                        //{ col: "directory", score: 2, usingJson: true },
                        //{ col: "date_added", score: 1 }
                    ],
                    table: "site",
                    join: "LEFT JOIN json USING (json_id)",
                    page: self.pageNum,
                    afterOrderBy: "date_added DESC",
                    limit: 8
                });

                page.cmd("as", [self.address, "dbQuery", [query]], function(results) {
                    if (results.length == 0 && self.pageNum != 0) {
                        self.pageNum--;
                        self.results = self.prevResults;
                        self.loading = false;
                        return;
                    }
                    self.results = results;
                    //console.log(results);
                    self.loading = false;
                });
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
				page.cmd("wrapperOpenWindow", ["/" + this.results[0].address]);
            },
            importZite: function(result) {
                this.$emit('import-zite', {
                    "title": result.title,
                    "address": result.address,
                    "language": result.language,
                    "cert_user_id": result.cert_user_id,
                    "description": result.description,
                    "tags": result.tags
                });
            }
		}
	}
</script>

