<template>
	<div id="AddZite" class="container">
		<div class="row">
	        <div class="col s12 m7 l9">
	        	<!--<component :is="topic_navbar" active="ask" :user-info="userInfo"></component>-->
	        	<div class="card">
	        		<div class="card-content">
	        			<span class="card-title">Add New Zite</span>
		        		<!-- Using form so I can get html5 form validation -->
		        		<form v-on:submit.prevent="addZite()">
			        		<div class="input-field">
			        			<input id="title" v-model="title" type="text" class="validate" required>
			        			<label for="title">Title *</label>
			        		</div>

                            <div class="input-field">
			        			<input id="creator" v-model="creator" type="text" class="validate" required>
			        			<label for="creator">Zite Creator/Maintainer *</label>
			        		</div>

			        		<div class="input-field">
			        			<textarea id="description" class="materialize-textarea validate" required v-model="description"></textarea>
			        			<label for="description">Description *</label>
			        		</div>

                            <div class="input-field col s12">
                                <select id="categoryselect"  ref="categoryselect" v-model="category" required>
                                    <option value="" disabled selected>Choose your option</option>
                                    <option v-for="category in categories" :value="category.slug">{{ category.name }}</option>
                                </select>
                                <label for="categoryselect">Category *</label>
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
                                    <span>Merger-Supported (<a href="#">more info</a>)</span>
                                </label>
                            </div>
                            <div class="input-field">
			        			<input id="mergerCategory" v-model="mergerCategory" type="text" class="validate">
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
	        <div class="col s12 m5 l3">
                <h4>Merger Settings</h4>
                <p>
                    If a zite collects data from merger zites, then check the <code>Merger Supported</code> checkbox and enter the <code>Merger Category Name</code> (e.g. ZeroMe, ZeroLSTN, Git Center) in the corresponding field.
                </p>
				<p>
					If a zite is a merger zite which is used by merger-supported zites (e.g. KaffieHub used by ZeroMe and Peeper), then enter the name of the Merger Category the zite belongs to in the <code>Merger Category Name</code> field (e.g. KaffieHub belongs to "ZeroMe" Merger Category). The field will Autocomplete with a lit of all Merger Categories used on the zite. If you do not see your merger category listed, just type the name into the field and it will be created upon submission.
                </p>
	        	<!--<component :is="connected_topics" :merger-zites="mergerZites"></component>-->
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	var M = require("materialize-css");

	module.exports = {
		props: ["userInfo"],
		name: "AddZite",
		data: () => {
			return {
				submitBtnDisabled: false,
				title: "",
                creator: "",
				description: "",
				tagsInstance: "",
                mergerSupported: false,
                nsfw: false,
                mergerCategory: "",
                category: null,
                categories: []
			}
		},
		beforeMount: function() {
            var self = this;
            page.getCategories()
                .then((categories) => {
                    console.log(categories);
                    self.categories = categories;
                });
		},
		updated: function() {
			var tags = this.$refs.tags;
			this.tagsInstance = M.Chips.init(tags, {
				placeholder: "Enter tags",
				secondaryPlaceholder: "+Tag"
			});

            var categorySelect = this.$refs.categoryselect;
            var instance = M.FormSelect.init(categorySelect, {});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
			},
            addZite: function() {
                if (!this.userInfo || !this.userInfo.auth_address) return; // Not logged in

                var tags = "";
                for (var i = 0; i < this.tagsInstance.chipsData.length; i++) {
					var chip = this.tagsInstance.chipsData[i];
					if (i == 0) {
						tags += chip.tag;
					} else {
						tags += "," + chip.tag;
					}
				}

				if (this.nsfw) {
					tags = "nsfw," + tags;
				}

                page.addZite(this.title, this.creator, this.description, tags, this.category, this.mergerSupported, this.mergerCategory)
                    .then(() => {
                        Router.navigate('');
                    });
            }
		}
	}
</script>