const processResponse = (res) => {
    if (res.ok === false) {
        throw res;
    }
    else
        return res.json();
};
export const getCurrentUser = () => fetch("/.netlify/functions/verify").then(processResponse);
export const getAllUsers = () => fetch("/.netlify/functions/user").then(processResponse);
export const getOneUser = (userId) => fetch(`/.netlify/functions/user/${userId}`).then(processResponse);
/**
 * A discussion is a topic with all comments attached
 **/
export const getDiscussion = topicId => fetch(`/.netlify/functions/topic/${topicId}`).then(processResponse);
export const postComment = (targetId, text) => fetch(`/.netlify/functions/comment/${targetId}`, {
    body: text,
    method: "POST"
}).then(processResponse);
export const deleteAuth = () => fetch(`/.netlify/functions/auth`, {
    method: "DELETE"
}).then(processResponse);
export const postAuth = (user, password) => {
    const credentials = "include";
    const encode = `${user}:${password}`;
    const nonAsciiChars = encode.match(/[^\x00-\x7F]/g);
    //TODO: Allow UTF-8 chars
    // window.btoa will fail if encode includes non-ASCII chars
    // This page seems to have good advice: https://attacomsian.com/blog/javascript-base64-encode-decode
    // Until then, throw an error if it's attempted
    if (nonAsciiChars) {
        throw Error(`Username / password combination included non-ASCII characters ${nonAsciiChars.join(", ")}`);
    }
    const basicCred = window.btoa(encode);
    const authReqInfo = {
        credentials: credentials,
        method: "POST",
        headers: {
            Authorization: `Basic ${basicCred}`
        }
    };
    return fetch(`/.netlify/functions/auth`, authReqInfo).then(processResponse);
};
// TOPICS
export const getAllTopics = () => fetch("/.netlify/functions/topic").then(processResponse);
export const getOneTopic = (topicId) => fetch(`/.netlify/functions/topic/${topicId}`).then(processResponse);
export const getDefaultDiscussionId = () => window.location.href.toLowerCase().replace(/[^a-z0-9]/g, "-");
export const createNewTopic = (id, title, isLocked = false) => {
    const body = `id=${id}&title=${title}&isLocked=${isLocked}`;
    const authReqInfo = {
        method: "POST",
        body
    };
    return fetch(`/.netlify/functions/topic`, authReqInfo).then(processResponse);
};
