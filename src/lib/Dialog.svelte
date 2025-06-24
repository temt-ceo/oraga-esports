<script>
	export let dialog;
</script>

<dialog bind:this={dialog} on:close>
		<div>You need a crypto wallet.<br>(You can sign out anytime)</div>
    <slot />
</dialog>

<style>
	dialog {
		padding: 30px;
		border-radius: 10px;
		background-color: rgb(132 225 188);
		text-align: right;
	}

	dialog > div {
		margin-bottom: 15px;
	}

	dialog > div.title {
		text-align: center;
	}

	dialog > :global(button) {
		width: 100px;
		height: 30px;
		margin: 3px;
	}

	input {
		padding: 5px;
	}

	.note {
		color: orange;
		font-size: 10px;
	}
</style>