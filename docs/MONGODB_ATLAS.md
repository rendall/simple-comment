# MongoDB Atlas

Atlas is MongoDB's cloud DBaaS. It has a free tier, which can drive the backend for _Simple Comment_. This is how to integrate your own cloud MongoDB instance into your backend. For free!

Follow these steps. If something is confusing or out of date, please [let us know](https://github.com/rendall/simple-comment/issues)

- Go to <https://account.mongodb.com/account/login>
- Make an account & sign in
- Navigate to the page entitled `Projects`
  - the leaf logo on the upper left will get you there
  - the URL will be different for everyone but it ends in `projects`
- Click the large green button that says _New Project_
  - Name your project (e.g. _Simple Comment_) and click _next_
  - Add any members you want to give access and click _Create Project_
- On the page entitled `Clusters` click _Build a Cluster_
  - Navigate to the page using the left-hand side-bar link _Clusters_ (if not redirected)
- Select one of _Shared_, _Dedicated_ or _Dedicated Multi-Region_ Clusters
  - Select _Shared Clusters_ for the free tier
  - Click the _Create a Cluster_ button under your choice
- Select any available region and cloud provider you prefer!
  - Often, one would select the region closest to the bulk of one's users
  - The free tier of _Netlify functions_ is [deployed in _AWS_ `us-eastl-1`](https://community.netlify.com/t/support-guide-netlify-lambda-functions-101-debugging/347)
  - ... so let's choose the same! Highlight _N. Virginia_ `us-east-1`
  - Alter any of the other defaults you like
- Click _Create Cluster_ and click through any verification
- Find your way back to the `Clusters` page (if not redirected)
  - It will take some time for your cluster to be created
- Click the _connect_ button
- Under _Add a connection IP address_ click _Allow Access from Anywhere_
  - This can be changed when you have more information
  - The form adds `0.0.0.0/0` and click _Add IP Address_ to add it
- Under _Create a Database User_
  - Enter a database admin name
  - Enter a password
    - Create your own, or better:
    - Click _Autogenerate Secure Password_
    - Click _Show_
    - Copy the password from the field
  - Add the password as the value in the `DATABASE_ADMIN_PASSWORD` field in `.env`
    - That line would look something like this
      - `DATABASE_ADMIN_PASSWORD=K2216xwxkYUjdib`
  - Click _Create Database User_
- Click _Choose a connection method_
  - Click _Connect your application_
    - Under _Select your driver and version_ select _Node.js_ and _3.6 or later_
    - It will look something like this:
      - `mongodb+srv://hangtheadmin:<password>@cluster0.ypopp.mongodb.net/<dbname>?retryWrites=true`
    - Click _Copy_ next to the connection string
    - Paste that string as the value in the `DB_CONNECTION_STRING` in `.env`
    - Replace the `<password>` part with your `DATABASE_ADMIN_PASSWORD`
    - Replace the `<dbname>` part with your `DATABASE_NAME`
      - Example: `DB_CONNECTION_STRING=mongodb+srv://hangtheadmin:K2216xwxkYUjdib@cluster0.ypopp.mongodb.net/simple-comment-db?retryWrites=true`
- Congratulations! You have your own cloud database cluster!
  - You can log out and close all windows
