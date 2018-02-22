<template>
	<div id="mainapp" class="container">
		<div class="row">
	        <div class="col s12 m7 l9">

				<nav style="background-color: #1976D2; margin-bottom: 10px; margin-top: 8px;">
					<div class="nav-wrapper">
					<form>
						<div class="input-field">
						<input id="search" type="search" placeholder="Search" required>
						<label class="label-icon" for="search"><i class="material-icons">search</i></label>
						<i class="material-icons">close</i>
						</div>
					</form>
					</div>
				</nav>

	        	<!--<component :is="home_navbar" active="top" :user-info="userInfo"></component>-->

				<!--<h5>Recent</h5>
	        	<div class="divider"></div>-->
				<component :is="zite_list_item" :user-info="userInfo" v-for="zite in zites" :zite="zite" :show-category="true"></component>
	        </div>
	        <div class="col s12 m5 l3">
	        	<component :is="categories"></component>
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	var categories = require("../vue_components/categories.vue");
	var ziteListItem = require("../vue_components/zite_list_item.vue");
	//var HomeNavbar = require("../vue_components/home_navbar.vue");

	module.exports = {
		props: ["userInfo"],
		name: "mainapp",
		data: () => {
			return {
				categories: categories,
				//home_navbar: HomeNavbar,
				zite_list_item: ziteListItem,
				zites: []
			}
		},
		beforeMount: function() {
			var self = this;

			this.getZites();
			this.$parent.$on("update", function() {
				//self.getQuestions();
				self.getZites();
			});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
			},
			getZites: function() {
				var self = this;
				page.getZites()
					.then((zites) => {
						self.zites = zites;
					});
			}/*,
			getQuestions: function() {
                var self = this;

                page.getQuestionsRecent()
                    .then((questions) => {
                        self.recentQuestions = questions;
                    });
            }*/
		}
	}
</script>