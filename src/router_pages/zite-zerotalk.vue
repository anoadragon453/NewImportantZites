<template>
	<div id="ZiteZeroTalk" class="container">
		<div class="row">
	        <div class="col s12 m12 l9">
				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
					<form onsubmit="return false;">
                        <div class="row" style="padding: 0; margin: 0; height: 100%;">
                            <div class="input-field col s10 m11 l12" style="display: inline-block; margin: 0; padding: 0;">
                                <input id="search" type="search" :placeholder="langTranslation['Search ...'].replace(/\.\.\./, 'ZeroTalk')" v-on:input.prevent="getResults" v-on:keyup.enter="searchEnter($event)" v-model="searchQuery" required style="margin: 0;">
                                <label class="label-icon" for="search" style="padding-left: 10px;"><i class="material-icons">search</i></label>
                                <i class="material-icons" style="padding-right: 10px;" v-on:click.prevent="clearSearch()">close</i>
                            </div>
                            <div class="col s2 m1 hide-on-large-only">
                                <a class="dropdown-trigger" href="#" data-target='searchDropdown' ref="searchDropdownTrigger" style="margin: auto; text-align: center;">
                                    <i class="material-icons">keyboard_arrow_down</i>
                                </a>
                            </div>
                        </div>
					</form>
					</div>
				</nav>

				<ul id='searchDropdown' class='dropdown-content' ref="searchDropdown">
                    <li v-for="clone in clones" :key="clone.address" :class="{ 'active': address == clone.address }" v-on:click.prevent="switchClone(clone)"><a href="#">{{ clone.name }}</a></li>
				</ul>

                <div class="preloader-wrapper small active" v-if="loading">
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
                            <a :href="getTopicUrl(result)">{{ result.title }}</a>
                        </span>
                        <div class="truncate">{{ cleanupBody(result)}}</div>
                        <div v-if="getAddress(result)"><a :href="getAddress(result)">{{getAddress(result)}}</a></div>
                        <small>
                            {{ langTranslation["Published by ..."].replace(/\.\.\./, result.topic_creator_user_name) }} | {{ result.directory.replace(/users\//, "").replace(/\//g, "") }}
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
                <component :is="zite_search_sidebar" :lang-translation="langTranslation">
                    <div class="center-align side-header">{{ langTranslation["... Clones"].replace(/\.\.\./, "ZeroTalk") }}</div>
                    <ul class="collection">
                        <a class="collection-item center-align" href="#" v-for="clone in clones" :class="{ 'active': address == clone.address }" v-on:click.prevent="switchClone(clone)" :key="clone.address">{{ clone.name }}</a>
                    </ul>
                </component>
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
    var ziteSearchSidebar = require("../vue_components/zite_search_sidebar.vue");
    var searchDbQuery = require("../libs/search.js");

	module.exports = {
		props: ["userInfo", "langTranslation"],
		name: "ZiteZeroTalk",
		data: () => {
			return {
                zite_search_sidebar: ziteSearchSidebar,
                loading: true,
                prevResults: [],
                results: [],
                searchQuery: "",
				pageNum: 0,
                searchQuery: "",
                clones: [
                    { name: "ZeroTalk", address: "1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT" },
                    { name: "ZeroDevTalk", address: "142jqssVAj2iRxMACJg2dzipB5oicZYz5w" }
                ],
                address: "1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT",
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
                self.getCorsAndDb();
			});
		},
		mounted: function() {
			var searchDropdown = this.$refs.searchDropdownTrigger;
			var searchDropdown_instance = M.Dropdown.init(searchDropdown, {
				alignment: "right",
				constrainWidth: false,
				coverTrigger: false
			});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
            },
            getAddress: function(result) { // Expand this to handle more types of links
                var matches = result.body.match(/https?\:\/\/127\.0\.0\.1\:43110\/[A-Za-z0-9\.]+/);
                //console.log(matches);
                if (matches) {
                    return "/" + matches[0].replace(/https?\:\/\//g, "").replace(/127\.0\.0\.1/g, "").replace(/\:43110\/?/g, "").replace(/\//g, "");
                }
                return "";
            },
            getTopicUrl: function(result) {
                var titleToUrl = result.title.replace(/[^A-Za-z0-9]/g, "+").replace(/[+]+/g, "+").replace(/[+]+$/, "");

                return '/' + this.address + '/?Topic:'  + result.row_topic_uri + '/' + titleToUrl;
            },
            cleanupBody: function(result) {
                return result.body.replace(/\&nbsp\;/g, "").replace(/\s/g, " ");
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
                    id_col: "topic_id",
                    select: `topic.*, json.directory,
                        topic.topic_id || '_' || topic_creator_content.directory AS row_topic_uri,
                        topic_creator_user.value AS topic_creator_user_name,
                        CASE WHEN MAX(comment.added) IS NULL THEN topic.added ELSE MAX(comment.added) END as last_action`,
                    searchSelects: [
                        { col: "title", score: 5 },
                        { col: "body", score: 4 },
                        //{ col: "cert_user_id", score: 3, usingJson: true }, // 0list puts this in keyvalue instead of json table for some reason
                        //{ col: "directory", score: 2, usingJson: true },
                        //{ col: "added", score: 1 }
                    ],
                    table: "topic",
                    join: `LEFT JOIN json USING (json_id)
                        LEFT JOIN json AS topic_creator_content ON (topic_creator_content.directory = json.directory AND topic_creator_content.file_name = 'content.json')
                        LEFT JOIN keyvalue AS topic_creator_user ON (topic_creator_user.json_id = topic_creator_content.json_id AND topic_creator_user.key = 'cert_user_id')
                        LEFT JOIN comment ON (comment.topic_uri = row_topic_uri AND comment.added < ${Date.now()/1000+120})`,
                    page: self.pageNum,
                    afterOrderBy: `last_action DESC`,
                    groupBy: "topic.topic_id, topic.json_id",
                    having: `last_action < ${Date.now()/1000+120}`,
                    limit: 12
                });

                page.cmdp("as", [self.address, "dbQuery", [query]]).then(function(results) {
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
				page.cmd("wrapperOpenWindow", ["/" + this.zites[0].address]);
            },
            switchClone: function(clone) {
                this.loading = true;
                this.results = [];
                this.address = clone.address;
                this.dbfile = "zerotalk.db";
                if (clone.dbfile) this.dbfile = clone.dbfile;
                this.getCorsAndDb();
            }
		}
	}
</script>

