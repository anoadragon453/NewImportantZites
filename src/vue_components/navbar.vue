<template>
	<div>
		<ul id="userDropdown" class="dropdown-content">
			<li><a href="./?/" v-on:click.prevent="goto('')">{{ langTranslation["Home"] }}</a></li>
			<li><a href="./?/total-search" v-on:click.prevent="goto('total-search')">{{ langTranslation["Total Search"] }}</a></li>
			<li class="divider"></li>
			<li v-for="link in userLinks" v-if="isLoggedIn">
				<a :href="'./?/' + link.route" v-on:click.prevent="navbarLinkClick(link)">{{ link.name }}</a>
			</li>
			<li class="divider"></li>
			<li v-if="isLoggedIn">
				<a href="./?/settings" v-on:click.prevent="goto('settings')">{{ langTranslation["Settings"] }}</a>
			</li>
			<li><a href="#" v-on:click.prevent="login()">{{ langTranslation["Switch User"] }}</a></li>
			<li class="divider"></li>
			<li v-if="userInfo && userInfo.privatekey"><a href="./?/admin" v-on:click.prevent="goto('admin')">Admin</a></li>
		</ul>
		<nav id="navbar" class="green darken-4">
			<div class="nav-wrapper">
				<div class="container">
					<a href="./?/" class="brand-logo" v-on:click.prevent="navbarLinkClick({ route: '' })" style="font-size: 160%;">{{ langTranslation["Important Zites"] }}</a>
					<a href="#" data-target="mobile-nav" class="sidenav-trigger"><i class="material-icons">menu</i></a>
					<ul class="left" v-if="isLoggedIn && navbarLinksLeft">
						<li v-for="link in navbarLinksLeft">
							<a :href="'./?/' + link.route" v-on:click.prevent="navbarLinkClick(link)">{{ link.name }}</a>
						</li>
					</ul>
					<ul class="right hide-on-med-and-down">
						<li v-for="link in navbarLinksRight">
							<a :href="'./?/' + link.route" v-on:click.prevent="navbarLinkClick(link)">{{ link.name }}</a>
						</li>
						<li v-if="!isLoggedIn"><a v-on:click.prevent="login()">{{ langTranslation["Login"] }}</a></li>
						<li v-show="isLoggedIn"><a ref="userDropdownTrigger" class="dropdown-trigger" href="#!" data-target="userDropdown">{{ userInfo ? userInfo.cert_user_id : "" }}<i class="material-icons right">arrow_drop_down</i></a></li>
					</ul>
					<ul id="mobile-nav" class="sidenav">
						<li><a href="./?/" v-on:click.prevent="goto('')">{{ langTranslation["Home"] }}</a></li>
						<li><a href="./?/total-search" v-on:click.prevent="goto('total-search')">{{ langTranslation["Total Search"] }}</a></li>
						<li class="divider"></li>
						<li v-for="link in navbarLinksLeft">
							<a :href="'./?/' + link.route" v-on:click.prevent="navbarLinkClick(link)">{{ link.name }}</a>
						</li>
						<li v-for="link in navbarLinksRight">
							<a :href="'./?/' + link.route" v-on:click.prevent="navbarLinkClick(link)">{{ link.name }}</a>
						</li>
						<li v-for="link in userLinks" v-if="isLoggedIn">
							<a :href="'./?/' + link.route" v-on:click.prevent="navbarLinkClick(link)">{{ link.name }}</a>
						</li>
						<li v-if="!isLoggedIn"><a v-on:click.prevent="login()">{{ langTranslation["Login"] }}</a></li>
						<li v-else><a v-on:click.prevent="login()">{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
						<li v-if="isLoggedIn">
							<a href="./?/settings" v-on:click.prevent="goto('settings')" v-if="isLoggedIn">{{ langTranslation["Settings"] }}</a>
						</li>
						<li v-if="userInfo && userInfo.privatekey">
							<a href="./?/admin" v-on:click.prevent="goto('admin')" v-if="userInfo && userInfo.privatekey">Admin</a>
						</li>
						<li class="divider"></li>
						<li><a class="collection-item" :class="{ 'active': false }" :href="'./?/zite/zeroup'" v-on:click.prevent="goto('zite/zeroup');">ZeroUp</a></li>
						<li><a class="collection-item" :class="{ 'active': false }" :href="'./?/zite/zerosites'" v-on:click.prevent="goto('zite/zerosites');">ZeroSites</a></li>
						<li><a class="collection-item" :class="{ 'active': false }" :href="'./?/zite/zerolist'" v-on:click.prevent="goto('zite/zerolist');">0List</a></li>
						<li><a class="collection-item" :class="{ 'active': false }" :href="'./?/zite/zerotalk'" v-on:click.prevent="goto('zite/zerotalk');">ZeroTalk</a></li>
						<li><a class="collection-item" :class="{ 'active': false }" :href="'./?/zite/kiwipedia'" v-on:click.prevent="goto('zite/kiwipedia');">Kiwipedia</a></li>
					</ul>
				</div>
			</div>
		</nav>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	var M = require("materialize-css/dist/js/materialize.min.js");

	module.exports = {
		props: ["userInfo", "langTranslation"],
		name: "navbar",
		data: () => {
			return {
				ZiteName: "",
				userLinks: [
					{ name: "My Zites", route: "my-zites" },
					{ name: "My Bookmarks", route: "my-bookmarks" }
				],
				navbarLinksRight: [
					{ name: "Add Zite", route: "add-zite" }
				]
			}
		},
		beforeMount: function() {
			var self = this;
			this.$parent.$on("setLanguage", function(langTranslation) {
				self.ZiteName = langTranslation["Important Zites"];
				self.userLinks[0].name = langTranslation["My Zites"];
				self.userLinks[1].name = langTranslation["My Bookmarks"];
				self.navbarLinksRight[0].name = langTranslation["Add Zite"];
			});
			this.ZiteName = this.langTranslation["Important Zites"];
			this.userLinks[0].name = this.langTranslation["My Zites"];
			this.userLinks[1].name = this.langTranslation["My Bookmarks"];
			this.navbarLinksRight[0].name = this.langTranslation["Add Zite"];
		},
		mounted: function() {
			var self = this;
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

			var userDropdownTrigger_instance = M.Dropdown.init(this.$refs.userDropdownTrigger, {
				alignment: "right",
				coverTrigger: false
			});
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
				page.selectUser();
				return false;
			}
		}
	}
</script>
