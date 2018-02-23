<template>
	<nav id="navbar" class="green darken-4">
		<div class="nav-wrapper">
			<div class="container">
				<a href="./?/" class="brand-logo" v-on:click.prevent="navbarLinkClick({ route: '' })" style="font-size: 160%;">{{ ZiteName }}</a>
				<a href="#" data-target="mobile-nav" class="sidenav-trigger"><i class="material-icons">menu</i></a>
				<!--<ul class="left">-->
				<!--</ul>-->
				<ul class="right hide-on-med-and-down">
					<li v-for="link in navbarLinks">
						<a :href="'./?/' + link.route" v-on:click.prevent="navbarLinkClick(link)">{{ link.name }}</a>
					</li>
					<li v-if="!isLoggedIn"><a v-on:click.prevent="login()">Login</a></li>
					<li v-else><a v-on:click.prevent="login()">{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
				</ul>
				<ul id="mobile-nav" class="sidenav">
					<li><a href="./?/" v-on:click.prevent="goto('')">Home</a></li>
					<li v-for="link in navbarLinks">
						<a :href="'./?/' + link.route" v-on:click.prevent="navbarLinkClick(link)">{{ link.name }}</a>
					</li>
					<li v-if="!isLoggedIn"><a v-on:click.prevent="login()">Login</a></li>
					<li v-else><a v-on:click.prevent="">{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
					<li v-for="category in categories">
						<a :href="'./?/category' + category.slug">{{ category.name }}</a>
					</li>
				</ul>
			</div>
		</div>
	</nav>
</template>

<script>
	var Router = require("../libs/router.js");
	var M = require("materialize-css");

	module.exports = {
		props: ["userInfo"],
		name: "navbar",
		data: () => {
			return {
				ZiteName: "Important Zites",
				navbarLinks: [
					{ name: "Add Zite", route: "add-zite" },
				],

			}
		},
		mounted: function() {
			var self = this;
			/*page.getCategories() // TODO: Duplicated in home and categoryPage pages
				.then((categories) => {
					self.categories = categories;
				});*/
				
			var elem = document.querySelector('.sidenav');
  			var instance = new M.Sidenav(elem, {
  				edge: "left",
  				draggable: true
  			});
			if (!this.userInfo) {
				/*this.$parent.on('setUserInfo', function() {
					// TODO
				});*/
			}
		},
		computed: {
			isLoggedIn: function() {
				if (this.userInfo == null) return false;
				return this.userInfo.cert_user_id != null;
			}
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
			},
			navbarLinkClick: function(link) {
				if (link.route !== null || link.route === "#") {
					Router.navigate(link.route);
				} else {
					link.onclick(this);
				}
			},
			login: function() {
				console.log("Login button clicked!");
				console.log(this.userInfo);
				page.selectUser();
				return false;
			}
		}
	}
</script>