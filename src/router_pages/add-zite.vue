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
			        			<textarea id="description" class="materialize-textarea validate" required v-model="description"></textarea>
			        			<label for="description">Description *</label>
			        		</div>

                            <div class="input-field col s12" ref="categoryselect">
                                <select id="categoryselect">
                                    <option value="" disabled selected>Choose your option</option>
                                    <option v-for="category in categories" :value="category.slug">{{ category.name }}</option>
                                </select>
                                <label for="categoryselect">Category</label>
                            </div>

							<div class="chips chips-placeholder" ref="tags" style="margin-bottom: 0;"></div>
							<small>Press enter to add tag</small><br>
                            <!-- TODO: NSFW checkbox -->
                            <!-- TODO: Merger-supported and merger-slug -->
							<br>
			        		<button type="submit" class="btn waves-effect waves-light" :class="{ 'disabled': submitBtnDisabled }">Submit</button>
							<br>
							<small><em style="text-color: red;">* required</em></small>
			        	</form>
			        </div>
	        	</div>
	        </div>
	        <div class="col s12 m5 l3">
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
				description: "",
				tagsInstance: "",
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
		mounted: function() {
			var tags = this.$refs.tags;
			this.tagsInstance = M.Chips.init(tags, {
				placeholder: "Enter tags *",
				secondaryPlaceholder: "+Tag"
			});

            var categorySelect = this.$refs.categoryselect;
            var instance = M.FormSelect.init(categorySelect, {});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
			}
		}
	}
</script>