<template>
	<div id="mainapp" class="container">
		<div class="row">
	        <div class="col s12 m7 l9">
	        	<!--<component :is="home_navbar" active="top" :user-info="userInfo"></component>-->

				<!--<h5>Recent</h5>
	        	<div class="divider"></div>-->
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
	//var HomeNavbar = require("../vue_components/home_navbar.vue");

	module.exports = {
		props: ["userInfo"],
		name: "mainapp",
		data: () => {
			return {
				categories: categories,
				//home_navbar: HomeNavbar,
				//question_list_item: QuestionListItem,
				recentQuestions: []
			}
		},
		beforeMount: function() {
			var self = this;

			this.$parent.$on("update", function() {
				//self.getQuestions();
			});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
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