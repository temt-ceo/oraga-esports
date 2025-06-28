<script>
	export let dialog;
</script>

<dialog bind:this={dialog} on:close>
	<slot />
</dialog>

<style>
	dialog {
		padding: 30px;
		border-radius: 10px;
		background-color: rgb(132 225 188);
		text-align: right;
	}

	dialog > :global(div) {
		text-align: left;
	}

	dialog > :global(button) {
		width: 100px;
		height: 30px;
		margin: 3px;
		border-radius: 6px;
		color: dodgerblue;
	}
</style>