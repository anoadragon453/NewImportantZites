<template>
	<div id="MyBookmarks" class="container">
		<div class="row">
	        <div class="col s12 m12 l9">
				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
					<form onsubmit="return false;">
						<div class="input-field">
						<input id="search" type="search" :placeholder="langTranslation['Search My Bookmarks']" v-on:keyup.enter="searchEnter($event)" v-on:input.prevent="getZites" v-model="searchQuery" required>
						<label class="label-icon" for="search"><i class="material-icons">search</i></label>
						<i class="material-icons" v-on:click.prevent="clearSearch()">close</i>
						</div>
					</form>
					</div>
				</nav>

				<component :is="zite_list_item" :user-info="userInfo" v-for="zite in zites" :zite="zite" :show-category="true" :categories="categories" v-on:update="getZites()" :lang-translation="langTranslation"></component>

				<ul class="pagination center-align" v-if="zites.length != 0">
					<li><a href="#!" v-on:click.prevent="previousPage"><i class="material-icons">chevron_left</i></a></li>
					<li class="disabled"><a href="#!">{{ pageNum + 1 }}</a></li>
					<li><a href="#!" v-on:click.prevent="nextPage"><i class="material-icons">chevron_right</i></a></li>
				</ul>
	        </div>
	        <div class="col s12 m12 l3">
				<div class="card">
					<div class="card-content">
						<div class="center-align side-header">{{ langTranslation["Categories"] }}</div>

						<ul class="collection">
							<a class="collection-item center-align" :class="{ 'active': categoryIsActive('All') }" href="#" v-on:click.prevent="changeCategoryId('All')">{{ langTranslation["All"] }}</a>
							<a class="collection-item center-align" :class="{ 'active': categoryIsActive('MyZites') }" href="#" v-on:click.prevent="changeCategoryId('MyZites')">{{ langTranslation["My Zites"] }}</a>
							<a class="collection-item center-align" href="#" v-for="category in categories" :class="{ 'active': categoryIsActive(category.id) }" v-on:click.prevent="changeCategoryId(category.id)">{{ category.name }}</a>
						</ul>
						<br>
						<div style="text-align: center;"><a href="#" v-on:click.prevent="toggleAddCategory">Add New Category</a></div>
						<div style="text-align: center;"><a href="#" v-on:click.prevent="toggleAddZitesToCategory">Add Zite To Category</a></div>
					</div>
					<div class="card-content card-section" v-if="showAddCategoryForm">
						<div class="input-field">
							<input id="categoryname" v-model="categoryname" type="text" class="validate">
							<label for="categoryname">{{ langTranslation["Name"] }}</label>
						</div>
						<button type="submit" class="btn waves-effect waves-light" :class="{ 'disabled': submitBtnDisabled }" v-on:click.prevent="addBookmarkCategory">{{ langTranslation["Submit"] }}</button>
					</div>
					<div class="card-content card-section" v-show="showAddZitesToCategory">
						<div class="input-field col s12">
							<select id="categoryToAddTo"  ref="categoryToAddTo" v-model="selectedCategoryToAddTo" required>
								<option value="" disabled selected>{{ langTranslation["Choose Your Option"] }}</option>
								<option v-for="category in categories" :value="category.id">{{ category.name }}</option>
							</select>
							<label for="categoryToAddTo">{{ langTranslation["Categories"] }} *</label> <!-- Use Category instead -->
						</div>

						<div class="input-field col s12">
							<select id="selectedZiteSelect"  ref="selectedZiteSelect" v-model="selectedZite" required>
								<option value="" disabled selected>{{ langTranslation["Choose Your Option"] }}</option>
								<option v-for="zite in allBookmarks" :value="zite.id + ',' + zite.directory.replace(/users\//, '').replace(/\//g, '')">{{ zite.title }}</option>
							</select>
							<label for="selectedZitesSelect">{{ langTranslation["Add Zite"] }} *</label>
						</div>

						<button type="submit" class="btn waves-effect waves-light" :class="{ 'disabled': submitBtnDisabled }" v-on:click.prevent="addZiteToCategory">{{ langTranslation["Submit"] }}</button>
					</div>
				</div>
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	//var categoriesSidebar = require("../vue_components/categories.vue");
	var ziteListItem = require("../vue_components/zite_list_item.vue");
	var M = require("materialize-css");

	module.exports = {
		props: ["userInfo", "langTranslation"],
		name: "MyBookmarks",
		data: () => {
			return {
				//categoriesSidebar: categoriesSidebar,
				zite_list_item: ziteListItem,
				zites: [],
				categories: [],
				pageNum: 0,
				searchQuery: "",
				selectedCategoryId: "All", // "All", "MyZites" - rest are integers for category id
				showAddCategoryForm: false,
				categoryname: "",
				showAddZitesToCategory: false,
				allBookmarks: [],
				selectedCategoryToAddTo: null,
				selectedZite: null,
				selectedZiteSelect_instance: null,
				categoryToAddTo_instance: null
			}
		},
		beforeMount: function() {
			var self = this;

			if (Router.currentParams["page"])
				this.pageNum = parseInt(Router.currentParams["page"]);

			if (this.userInfo) {
				this.getCategories();
				this.getZites();
			}
			this.$parent.$on("update", function() {
				//self.getQuestions();
				self.getCategories();
				self.getZites();
			});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
			},
			categoryIsActive: function(categoryId) {
				return categoryId == this.selectedCategoryId;
			},
			changeCategoryId: function(categoryId) {
				this.selectedCategoryId = categoryId;
				this.getZites();
			},
			getCategories: function() {
				var self = this;
				page.getBookmarkCategories()
					.then((categories) => {
						self.categories = categories;
					});
			},
			getZites: function() {
				var self = this;
				page.getBookmarkZitesSearch(this.selectedCategoryId, this.searchQuery, this.pageNum)
					.then((zites) => {
						if (zites.length == 0 && self.pageNum != 0) {
							self.pageNum--;
							self.getZites();
							return;
						}
						self.zites = zites;
						self.$emit("resultsChanged");
					});
				page.getBookmarkZites(0, 0)
					.then((zites) => {
						self.allBookmarks = zites;
					});
			},
			previousPage: function() { // TODO: Scroll to top
				this.pageNum -= 1;
				if (this.pageNum <= 0) this.pageNum = 0;
				this.getZites();
			},
			nextPage: function() {
				this.pageNum += 1;
				this.getZites();
            },
			clearSearch: function() {
				this.searchQuery = "";
				this.getZites();
			},
			searchEnter: function(e) {
				page.cmd("wrapperOpenWindow", ["/" + this.zites[0].address]);
			},
			toggleAddCategory: function() {
				if (this.showAddCategoryForm) {
					this.showAddCategoryForm = false;
				} else {
					// Reset form
					this.categoryname = "";
					this.showAddCategoryForm = true;
				}
			},
			toggleAddZitesToCategory: function() {
				if (this.showAddZitesToCategory) {
					this.showAddZitesToCategory = false;
				} else {
					this.showAddZitesToCategory = true;
					this.selectedCategoryToAddTo = null;
					this.selectedZite = null;

					// Initialize selects and get all bookmarks (without limit)
					var categoryToAddTo = this.$refs.categoryToAddTo;
					this.categoryToAddTo_instance = M.FormSelect.init(categoryToAddTo, {});
					var selectedZiteSelect = this.$refs.selectedZiteSelect;
					this.selectedZiteSelect_instance = M.FormSelect.init(selectedZiteSelect, {});
				}
			},
			addBookmarkCategory: function() {
				var self = this;
				page.addBookmarkCategory(this.categoryname, () => {
					self.categoryname = "";
					self.showAddCategoryForm = false;
					self.getCategories();
				});
			},
			addZiteToCategory: function() {
				var reference_id = parseInt(this.selectedZite.split(",")[0]);
				var reference_auth_address = this.selectedZite.split(",")[1];
				var self = this;
				console.log(reference_id);
				console.log(reference_auth_address);
				page.setBookmarkCategory(reference_id, reference_auth_address, this.selectedCategoryToAddTo, () => {
					self.showAddZitesToCategory = false;
					self.getZites();
				});
			}
		}
	}
</script>

