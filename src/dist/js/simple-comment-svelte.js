import SimpleComment from '../svelte/SimpleComment';

const simpleComment = new SimpleComment({
	target: document.querySelector("#simple-comment-display") ?? document.body,
	props: {
		name: 'world'
	}
});

export default simpleComment;