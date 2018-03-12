<template>
	<div id="EditZiteAdmin" class="container">
		<div class="row">
	        <div class="col s12 m12 l9">
	        	<!--<component :is="topic_navbar" active="ask" :user-info="userInfo"></component>-->
	        	<div class="card">
	        		<div class="card-content">
	        			<span class="card-title">Admin | Edit Zite</span>
		        		<!-- Using form so I can get html5 form validation -->
		        		<form v-on:submit.prevent="editZite()">
			        		<div class="input-field">
			        			<input ref="title" id="title" v-model="title" type="text" class="validate" v-on:change="titleChanged()" required>
			        			<label for="title">Title *</label>
			        		</div>

			        		<div class="input-field">
			        			<input ref="address" id="address" v-model="address" type="text" class="validate" v-on:change="addressChanged()" required>
			        			<label for="address">Zite Address * (Not .bit Domain)</label>
			        		</div>

			        		<div class="input-field">
			        			<input ref="domain" id="domain" v-model="domain" type="text" class="validate" v-on:change="domainChanged()">
			        			<label for="domain">Zite .bit Domain (if exists)</label>
			        		</div>

                            <div class="input-field">
			        			<input ref="creator" id="creator" v-model="creator" v-on:change="creatorChanged()" type="text" class="validate" required>
			        			<label for="creator">Zite Creator/Maintainer *</label>
			        		</div>

			        		<div class="input-field">
			        			<textarea ref="description" id="description" class="materialize-textarea validate" required v-model="description"></textarea>
			        			<label for="description">Description *</label>
			        		</div>

                            <div class="input-field col s12">
                                <select id="categoryselect"  ref="categoryselect" v-model="category" :value="category" v-on:change="updateTagsAutocompletion" required>
                                    <option value="" disabled selected>Choose your option</option>
                                    <option v-for="category in categories" :value="category.slug">{{ category.name }}</option>
                                </select>
                                <label for="categoryselect">Category *</label>
                            </div>

                            <div class="input-field col s12">
                                <select id="languageselect"  ref="languageselect" v-model="languages" :value="languages" multiple required>
                                    <option value="" disabled selected>Choose your option</option>
                                    <option v-for="language in ziteLanguages" :value="language">{{ language }}</option>
                                </select>
                                <label for="categoryselect">Language(s) *</label>
                            </div>

							<div class="chips chips-placeholder" ref="tags" style="margin-bottom: 0;"></div>
							<small>Press enter to add tag</small><br>
                            <br>
                            <label>
                                <input type="checkbox" v-model="nsfw" />
                                <span>NSFW</span>
                            </label>

                            <div>
                                <label>
                                    <input type="checkbox" v-model="mergerSupported" />
                                    <span>Merger-Supported (<em>more info in sidebar, or below on mobile</em>)</span>
                                </label>
                            </div>
                            <div class="input-field">
			        			<input id="mergerCategory" ref="mergercategory" v-model="mergerCategory" v-on:change="mergerCategoryChanged()" type="text" class="validate autocomplete">
			        			<label for="mergerCategory">Merger Category Name</label>
			        		</div>
                            
							<br>
			        		<button type="submit" class="btn waves-effect waves-light" :class="{ 'disabled': submitBtnDisabled }">Submit</button>
							<br>
							<small><em style="text-color: red;">* required</em></small>
			        	</form>
			        </div>
	        	</div>
	        </div>
	        <div class="col s12 m12 l3">
                <h4>Merger Settings</h4>
                <p>
                    If a zite collects data from merger zites, then check the <code>Merger Supported</code> checkbox and enter the <code>Merger Category Name</code> (e.g. ZeroMe, ZeroLSTN, Git Center) in the corresponding field.
                </p>
				<p>
					If a zite is a merger zite which is used by merger-supported zites (e.g. KaffieHub used by ZeroMe and Peeper), then enter the name of the Merger Category the zite belongs to in the <code>Merger Category Name</code> field (e.g. KaffieHub belongs to "ZeroMe" Merger Category). The field will Autocomplete with a list of all Merger Categories used on the zite. If you do not see your merger category listed, just type the name into the field and it will be created upon submission.
                </p>
	        	<!--<component :is="connected_topics" :merger-zites="mergerZites"></component>-->
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	var M = require("materialize-css/dist/js/materialize.min.js");

	module.exports = {
		props: ["userInfo"],
		name: "EditZiteAdmin",
		data: () => {
			return {
				ziteLanguages: ziteLanguages, // Total possible languages, displayed in language selection
				submitBtnDisabled: false,
				id: 0,
				title: "",
				address: "",
				domain: "",
                creator: "",
                description: "",
                ziteTags: "",
				tagsInstance: null,
				categorySelect_instance: null,
				mergerCategory_instance: null,
                mergerSupported: false,
                nsfw: false,
                mergerCategory: "",
                category: null,
				categories: [],
				languages: [],
                mergerCategoryNames: [],
                directory: ""
			}
		},
		beforeMount: function() {
            if (!this.userInfo || !this.userInfo.privatekey) Router.navigate("");
			this.getInfo(this.userInfo);

			this.$parent.$on('setuserinfo', this.getInfo);
		},
		updated: function() {
			this.updateFields();
        },
        computed: {
            getAuthAddress: function() {
                return this.directory.replace(/users\//g, "").replace(/\//g, "");
            }
        },
		methods: {
			getInfo: function(userInfo) {
				var self = this;
				page.getCategories()
					.then((categories) => {
						self.categories = categories;

						if (!userInfo || !userInfo.auth_address || !userInfo.privatekey) return; // Not logged in
						return page.getZite(Router.currentParams["authaddress"], Router.currentParams["ziteid"]);
					}).then((zites) => {
						var zite = zites[0];
						self.id = zite.id;
						self.title = zite.title;
						self.address = zite.address;
						self.domain = zite.domain;
						self.creator = zite.creator;
						self.description = zite.description;
						self.mergerCategory = zite.merger_category;
						self.mergerSupported = zite.merger_supported;
						self.category = zite.category_slug;
						if (zite.languages) {
							self.languages = zite.languages.split(",");
						}
                        self.ziteTags = zite.tags;
                        self.directory = zite.directory;

						M.updateTextFields(); // TODO: Not working

						//self.tagsInstance.addChip();
						var tags = self.ziteTags.split(",");
						if (tags[0] == "nsfw") {
							self.nsfw = true;
							tags = tags.splice(0, 1);
						}

						for (var i in tags) {
							self.tagsInstance.addChip({
								tag: tags[i]
							});
						}

						self.updateTagsAutocompletion();

						var categoryName = "";
						for (var i in self.categories) {
							if (self.categories[i].slug == self.category) {
								categoryName = self.categories[i].name;
								break;
							}
						}
						var categorySelect = self.$refs.categoryselect;
						self.categorySelect_instance = M.FormSelect.init(categorySelect, {});
						self.categorySelect_instance.input.value = categoryName;

						var languageSelect = self.$refs.languageselect;
						self.languageSelect_instance = M.FormSelect.init(languageSelect, {});
						self.languageSelect_instance.input.value = self.languages;

						var autocompleteData = {};
						for (row in self.mergerCategoryNames) {
							autocompleteData[self.mergerCategoryNames[row].merger_category] = null;
						}
						
						var mergerCategory = self.$refs.mergercategory;
						self.mergerCategory_instance = M.Autocomplete.init(mergerCategory, {
							data: autocompleteData,
							onAutocomplete: (text) => {
								self.mergerCategory = text;
							}
						});
						self.$forceUpdate();
					});
				page.getMergerCategoryNames()
					.then((names) => {
						self.mergerCategoryNames = names;
					});
			},
			updateFields: function(force = false) {
				var tags = this.$refs.tags;
				if (!this.tagsInstance || force) {
					// Autocompletion data
					var autocompleteData = {};
					for (i in this.categories) {
						var category_tags = this.categories[i].tags.split(",");
						for (j in category_tags) {
							var tag = category_tags[j];
							if (!autocompleteData[tag]) autocompleteData[tag] = null;
						}
					}
					this.tagsInstance = M.Chips.init(tags, {
						placeholder: "Enter tags",
						secondaryPlaceholder: "+Tag",
						autocompleteOptions: {
							data: autocompleteData,
							limit: Infinity
						}
					});
				}
			},
			goto: function(to) {
				Router.navigate(to);
			},
            editZite: function() {
                if (!this.userInfo || !this.userInfo.auth_address || !this.userInfo.privatekey) {
					page.cmdp("wrapperNotification", ["info", "Please login first."]);
					page.selectUser();
					return; // Not logged in
				}

                var tags = "";
                for (var i = 0; i < this.tagsInstance.chipsData.length; i++) {
					var chip = this.tagsInstance.chipsData[i];
					if (i == 0) {
						tags += chip.tag;
					} else {
						tags += "," + chip.tag;
					}
				}

				tags = tags.replace(/nsfw,/g, ""); // If nsfw already in tags, remove it in case of changes, and so it's not duplicated.
				if (this.nsfw) {
					tags = "nsfw," + tags;
				}

                page.editZiteAdmin(this.getAuthAddress, this.id, this.title, this.address, this.domain, this.creator, this.description, tags, this.category, this.mergerSupported, this.mergerCategory, this.languages.join(","), () => {
					Router.navigate("admin");
				});
			},
			addressChanged: function() {
				this.address = this.address.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co|bit))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\/$/g, "");
			},
			domainChanged: function() {
				this.domain = this.domain.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\/$/g, "");
			},
			titleChanged: function() {
				this.title = this.title.replace(/((https?|zero|zeronet)\:\/\/|(127\.0\.0\.1|192\.168\.0\.[0-9]+)(\:[0-9]+)?\/?|localhost|.*(\.(com|net|org|tk|uk|eu|co))+(\:[0-9]+)?\/?|zero\/)/g, "").replace(/(\?|#)\/?$/, "").replace(/\.bit/g, "").replace(/(#.*|\?.*)/g, "").replace(/\/$/g, "");
			},
			creatorChanged: function() {
				this.creator = this.creator.replace(/(.)@.*$/g, "$1");
			},
			mergerCategoryChanged: function() {
				this.mergerCategory = this.mergerCategory.replace(/(merger|merged)-/g, "");
			},
			updateTagsAutocompletion: function() {
				var data = {};
				var tags = "";
				for (i in this.categories) {
					var category = this.categories[i];
					if (category.slug == this.category) {
						tags = category.tags.split(",");
						break;
					}
				}
				for (var i = 0; i < tags.length; i++) {
					data[tags[i]] = null;
				}
				
				this.tagsInstance.autocomplete.updateData(data);
			}
		}
	}
</script>

