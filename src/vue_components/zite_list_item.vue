<template>
	<div class="card" id="zite-list-item" style="margin-bottom: .8rem;">
		<div class="card-content">
			<span class="card-title" style="margin-bottom: 0;">
				<a :href="'/' + (zite.domain || zite.address)">{{ zite.title }}</a>
			</span>
			<div> <!-- limit text amount in some way, truncate? -->
				{{ zite.description }}
			</div>
            <!-- Add Zite Creator -->
			<small>
                <!--Published {{ getDate }} <span>by <a href="#">{{ getName }}</a><span v-if="showCategory"> in <a href="#">{{ getCategoryName }}</a></span></span><br>-->
                Created by <a href="#">{{ zite.creator }}</a><span v-if="zite.creator.toLowerCase().replace(/@.*/g, '').replace(/\s/g, '') != getName.toLowerCase()">, Submitted by <a href="#">{{ getName }}</a></span>
				<em v-if="userIsOwner"> | <a :href="'edit-zie/' + zite.id" v-on:click.prevent="goto('edit-zite/' + zite.id)">Edit</a> | <a href="#" v-on:click.prevent="deleteZite()">Delete</a></em><em v-if="userInfo"> | <a href="#" v-on:click.prevent="toggleBookmark()">{{ zite.bookmarkCount >= 1 ? "Unbookmark" : "Bookmark" }}</a>
				<span v-if="userInfo && userInfo.privatekey"> | <a :href="'./?/admin/edit/' + getAuthAddress + '/' + zite.id" v-on:click.prevent="goto('admin/edit/' + getAuthAddress + '/' + zite.id)">Admin Edit</a> | <a href="#" v-on:click.prevent="deleteZiteAdmin()">Admin Delete</a></span></em>
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
				return this.zite.directory.replace(/users\//, "").replace(/\//g, "");
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
			},
			deleteZite() {
				if (!this.userInfo || !this.userInfo.auth_address || !this.userIsOwner) return;

				var self = this;
				page.deleteZite(this.zite.id, () => {
					self.$emit("update");
				});
			},
			deleteZiteAdmin() {
				if (!this.userInfo || !this.userInfo.privatekey) return;

				var self = this;
				page.deleteZiteAdmin(this.getAuthAddress, this.zite.id, () => {
					self.$emit("update");
				});
			},
			toggleBookmark: function() {
				if (!this.userInfo) {
					page.cmd("wrapperNotification", ["info", "Please login first!"]);
					page.selectUser();
					return false;
				}

				var self = this;
				if (this.zite.bookmarkCount >= 1) {
					page.removeBookmark(this.zite.id, this.getAuthAddress, () => {
						self.$emit("update");
					});
				} else {
					page.addBookmark(this.zite.id, this.getAuthAddress, () => {
						self.$emit("update");
					});
				}
			}
		}
	};
</script>