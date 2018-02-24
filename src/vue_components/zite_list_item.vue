<template>
	<div class="card" id="zite-list-item">
		<div class="card-content">
			<span class="card-title">
				<a :href="'/' + (zite.domain || zite.address)">{{ zite.title }}</a>
			</span>
			<p> <!-- limit text amount in some way, truncate? -->
				{{ zite.description }}
			</p>
            <!-- Add Zite Creator -->
			<small>
                <!--Published {{ getDate }} <span>by <a href="#">{{ getName }}</a><span v-if="showCategory"> in <a href="#">{{ getCategoryName }}</a></span></span><br>-->
                Created by <a href="#">{{ zite.creator }}</a><span v-if="zite.creator.toLowerCase().replace(/@.*/g, '').replace(/\s/g, '') != getName.toLowerCase()">, Submitted by <a href="#">{{ getName }}</a></span>
            </small>
		</div>
	</div>
</template>

<script>
	var moment = require("moment");
	var Router = require("../libs/router.js");

	module.exports = {
		props: ["userInfo", "zite", "showCategory", "categories"],
		name: "zite-list-item",
		computed: {
			getName: function() {
				if (!this.zite.cert_user_id) return "";
				var name = this.zite.cert_user_id.replace(/@.+/, "");
				return name[0].toUpperCase() + name.slice(1);
			},
			getDate: function() {
				return moment(this.zite.date_added).fromNow();
			},
			getAuthAddress: function() {
				return this.zite.directory.replace(/data\/users\//, "").replace(/\//g, "");
			},
			getCategoryName: function() {
				if (!this.categories || this.categories.length == 0) return this.zite.category_slug;
				for (category of this.categories) {
					if (this.zite.category_slug == category.slug) {
						return category.name;
					}
				}
				return "[UNKNOWN]";
			},
			userIsOwner: function() {
				if (!this.userInfo) return false;
				return this.getAuthAddress == this.userInfo.auth_address;
			}
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
			}
		}
	};
</script>