# MongoDB Atlas

Atlas is MongoDB's cloud DBaaS. It has a free tier, which can drive the backend for *Simple Comment*. This is how to integrate your own cloud MongoDB instance into your backend. For free!

Follow these steps. If something is confusing or out of date, please [let us know](https://github.com/rendall/simple-comment/issues)

* Go to <https://account.mongodb.com/account/login>
* Make an account & sign in
* Navigate to the page entitled `Projects`
  * the leaf logo on the upper left will get you there
  * the URL will be different for everyone but it ends in `projects`
* Click the large green button that says *New Project*
  * Name your project (e.g. *Simple Comment*) and click _next_
  * Add any members you want to give access and click *Create Project*
* On the page entitled `Clusters` click *Build a Cluster*
  * Navigate to the page using the left-hand side-bar link *Clusters* (if not redirected)
* Select one of *Shared*, *Dedicated* or *Dedicated Multi-Region* Clusters
  * Select *Shared Clusters* for the free tier
  * Click the *Create a Cluster* button under your choice
* Select any available region and cloud provider you prefer!
  * Often, one would select the region closest to the bulk of one's users
  * The free tier of *Netlify functions* is [deployed in *AWS* `us-eastl-1`](https://community.netlify.com/t/support-guide-netlify-lambda-functions-101-debugging/347)
  * ... so let's choose the same! Highlight *N. Virginia* `us-east-1`
  * Alter any of the other defaults you like
* Click *Create Cluster* and click through any verification
* Find your way back to the `Clusters` page (if not redirected)
  * It will take some time for your cluster to be created
* Click the *connect* button
* Under *Add a connection IP address* click *Allow Access from Anywhere*
  * This can be changed when you have more information
  * The form adds `0.0.0.0/0` and click *Add IP Address* to add it
* Under *Create a Database User*
  * Enter a database admin name
  * Enter a password
    * Create your own, or better:
    * Click *Autogenerate Secure Password*
    * Click *Show*
    * Copy the password from the field
  * Add the password as the value in the `DATABASE_ADMIN_PASSWORD` field in `.env`
    * That line would look something like this
      * `DATABASE_ADMIN_PASSWORD=K2216xwxkYUjdib`
  * Click *Create Database User*
* Click *Choose a connection method*
  * Click *Connect your application*
    * Under *Select your driver and version* select *Node.js* and *3.6 or later*
    * It will look something like this:
      * `mongodb+srv://hangtheadmin:<password>@cluster0.ypopp.mongodb.net/<dbname>?retryWrites=true`
    * Click *Copy* next to the connection string
    * Paste that string as the value in the `DB_CONNECTION_STRING` in `.env`
    * Replace the `<password>` part with your `DATABASE_ADMIN_PASSWORD`
    * Replace the `<dbname>` part with your `DATABASE_NAME`
      * Example: `DB_CONNECTION_STRING=mongodb+srv://hangtheadmin:K2216xwxkYUjdib@cluster0.ypopp.mongodb.net/simple-comment-db?retryWrites=true`
* Congratulations! You have your own cloud database cluster!
  * You can log out and close all windows
