<template>
    <div id="zite-search-sidebar">
        <div class="card">
            <div class="card-content">
                <slot></slot>

				<div class="center-align side-header">{{ langTranslation["Search Other Zites"] }}</div>

				<ul class="collection">
					<a class="collection-item center-align" :class="{ 'active': false }" :href="'./?/'" v-on:click.prevent="goto('');">{{ langTranslation["Important Zites"] }}</a>
					<a class="collection-item center-align" :class="{ 'active': false }" :href="'./?/zite/zeroup'" v-on:click.prevent="goto('zite/zeroup');">ZeroUp</a>
					<a class="collection-item center-align" :class="{ 'active': false }" :href="'./?/zite/zerosites'" v-on:click.prevent="goto('zite/zerosites');">ZeroSites</a>
					<a class="collection-item center-align" :class="{ 'active': false }" :href="'./?/zite/zerolist'" v-on:click.prevent="goto('zite/zerolist');">0List</a>
					<a class="collection-item center-align" :class="{ 'active': false }" :href="'./?/zite/zerotalk'" v-on:click.prevent="goto('zite/zerotalk');">ZeroTalk</a>
					<a class="collection-item center-align" :class="{ 'active': false }" :href="'./?/zite/kiwipedia'" v-on:click.prevent="goto('zite/kiwipedia');">Kiwipedia</a>
				</ul>

            </div>
        </div>
    </div>
</template>

<style>
	.collection .collection-item {
		padding-top: 7px;
		padding-bottom: 7px;
	}
	.side-header {
		font-weight: 400;
	}
</style>

<script>
	var Router = require("../libs/router.js");

	module.exports = {
		props: ["langTranslation"],
		name: "zite-search-sidebar",
		methods: {
			goto: function(to) {
				Router.navigate(to);
			},
			isActive: function(slug) {
                return false;
			}
		}
	};
</script>
