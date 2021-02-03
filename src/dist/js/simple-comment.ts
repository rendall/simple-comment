import App from '../svelte/App.svelte'

const documentTarget = () => {
  console.info("Looking for Simple Comment area...")

  const existingDiv = document.querySelector("#simple-comment-display")

  if (!!existingDiv) console.info("`#simple-comment-display` found")
  else console.info("`#simple-comment-display` not found. Creating.")

  const createdDiv = existingDiv ? null : document.createElement("div")

  if (createdDiv) {
    // #simple-comment-display does not exist, so let us create it:
    createdDiv.setAttribute("id", "simple-comment-display")

    // append it to body:
    const body = document.querySelector("body")
    body.appendChild(createdDiv)
    console.info("`div#simple-comment-display` created and appended to `body`.")
  }

  const simpleCommentArea = existingDiv || createdDiv

  if (!simpleCommentArea) {
    console.error(
      "Simple Comment area not found. q.v. https://github.com/rendall/simple-comment "
    )
    return
  }

	console.info("Simple Comment area found! - attempting to set up UI...")
	
	return simpleCommentArea

}

const app = new App({
	target: documentTarget()
});

export default app;