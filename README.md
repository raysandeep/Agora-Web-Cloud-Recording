# Cloud Recording for Web Video Chat

Last week I had to give a mid-review for one of my projects in college and it carried around 30 marks. It was a big deal for me so I attended the review explained my project. My ma’am had a lot of recommendations for me and suggested that I do a lot of changes to the paper I was writing related to the project. I was too involved in the moment and nodded agreeing to whatever she was saying. Two days later when I sat down to work on the changes I wasn’t so surprised about the fact that I actually forgot half of the suggestions she gave me. Then it hit me only if I had a recording of this video call I wouldn’t have to worry so much about forgetting or noting down every detail while in a call.

So, I started working on Cloud Recording with Agora to make sure I won’t face the same issue again.

## Prerequisites

1. Clone the [quick start repo](https://github.com/technophilic/Agora-NG-basic) as the base project to work on.

1. An Agora developer account (see [How to get started](https://www.agora.io/en/blog/how-to-get-started-with-agora))

1. AWS Account.

1. Have basic server-side coding knowledge and environment.

1. Heroku Account / VM to deploy the backend.

## Architecture

![](https://cdn-images-1.medium.com/max/2000/1*Ht1jTAmybt_dm_7pdabwRg.jpeg)

We are having a small client-server architecture. All the communication will be happening through Rest APIs.

**Video Calling Website:** Frontend will be responsible for starting and stopping the recording.

**GoLang Backend:** A backend server that has all the access keys and secrets required for recording.

**Agora Cloud Recording Server:** Responsible for uploading all the media fragments to AWS S3 Bucket.

**AWS S3 Bucket:** A bucket to store media fragments.

## Agora Setup

1. We begin by creating a project on Agora Console.

![](https://cdn-images-1.medium.com/max/2000/1*OB5MjWBY00Y6xrPQxLHSUw.png)

> Note: Choose Secured Mode while creating the project

2. Enable cloud recording by clicking on the _“View usage”_ button and enable the cloud recording.

![](https://cdn-images-1.medium.com/max/2000/1*qVGf_gl_GVj1kHK0iLSILw.png)

3. Copy App ID and App Certificate from the same page to a text file. We will be requiring this in the future.

4. Head on to this [link](https://console.agora.io/restfulApi), and click on the _“Add Secret”_ button. Copy Customer Id and Customer Secret to the text file.

## **AWS Setup**

1. Head on to your AWS IAM Console, create a new user. If your unable to find it click on this [link](https://console.aws.amazon.com/iam/home#/users).

![](https://cdn-images-1.medium.com/max/2180/1*r4kne_HD_fZymUw6rc7JPQ.png)

> Note: Make sure you add AmazonS3FullAccess policy with Programmatic Access.

2. Once done copy your AWS Access Key and Secret Key to the text file.

3. Now, let’s create an AWS S3 Bucket. If you already have a bucket you can skip this step. If you are unable to find the AWS S3 service click on this [link](https://s3.console.aws.amazon.com/s3/home).

4. Create a bucket and note down the bucket name and equivalent bucket number. In my case, it is “14” you can find yours from this [table](https://docs.agora.io/en/cloud-recording/cloud_recording_api_rest?platform=RESTful#a-namestorageconfigacloud-storage-configuration).

![](https://cdn-images-1.medium.com/max/2000/1*ou9JAYIGyJXBJAUzcYgw6w.png)

## **Backend**

1.  Before deploying our backend let’s check if we have all our environment variables.

        APP_ID=
        APP_CERTIFICATE=
        RECORDING_VENDOR=
        RECORDING_REGION=
        BUCKET_NAME=
        BUCKET_ACCESS_KEY=
        BUCKET_ACCESS_SECRET=
        CUSTOMER_ID=
        CUSTOMER_CERTIFICATE=

    > Note: RECORDING_VENDOR=1 for AWS. Refer to this [link](https://docs.agora.io/en/cloud-recording/cloud_recording_api_rest?platform=RESTful#a-namestorageconfigacloud-storage-configuration) for more information.

2.  To deploy click on the below button and fill in your environment variables.

[![Click the deploy button above to start](https://cdn-images-1.medium.com/max/2000/0*Um1JR2yL1yJcFn1h.png)](https://heroku.com/deploy?template=https://github.com/raysandeep/Agora-Cloud-Recording-Example/)

_Click the deploy button above to start_

3. Let’s import your postman collection.

[![Click the postman button to open docs.](https://cdn-images-1.medium.com/max/2000/1*htvlsa6XJ-A4vYWsOGW4-Q.jpeg)](https://documenter.getpostman.com/view/8653133/TzCS4RCq)

_Click the postman button to open docs._

4. Hurray! Now, your backend setup is completed. If you want to test your backend you can call the APIs from the postman and use the [web demo frontend](https://webdemo.agora.io/agora-web-showcase/) to join the call.

## Frontend

Download the base code for the frontend. We will be using Agora NG SDK for this tutorial.

    git clone https://github.com/technophilic/Agora-NG-basic

Let’s add base URL on the top of the scripts.js file.

    let baseUrl = "https://cloud-recorder.herokuapp.com";

Let’s make a helper function to fetch tokens from our backend.

    async function getToken(channelName) {
        const data = await fetch(
            `${baseUrl}/api/get/rtc/${channelName}`
        ).then((response) => response.json());
        return data;
    }

Now, call the getToken() function after fetching the channelName from the form. And assign token & uid to two different variables.

    let appId = document.getElementById("app-id").value;
    let channelId = document.getElementById("channel").value;
    let data = await getToken(channelId);
    let token = data.rtc_token;
    let uid = data.uid;

Edit client.join method and pass uid & token .

    const _uid = await client.join(appId, channelId, token, uid);

Add 2 buttons to the frontend namely Start Recording & Stop Recording in index.html file. By default both the buttons are disabled.

    <button id="startRecording" disabled=true>Start Recording</button>
    <button id="stopRecording" disabled=true>Stop Recording</button>

After publishing local streams, enable the Start Recording button.

    // Initialize the start recording button
    document.getElementById("startRecording").disabled = false;

Let’s make a onclick event listeners for Start Recording button.

    document.getElementById("startRecording").onclick = async function () {
        let channelId = document.getElementById("channel").value;
        // request your backend to start call recording.
        startcall = await fetch(`${baseUrl}/api/start/call`, {
            method: "post",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                Accept: "application/json",
            },
            body: JSON.stringify({ channel: channelId }),
        }).then((response) => response.json());
        console.log(startcall.data);
        // Initialize the stop recording button.
        initStopRecording(startcall.data);
        // Disable the start recording button.
        document.getElementById("startRecording").disabled = true;
    };

initStopRecording is defined at the end of the code for stopping call recording.

    function initStopRecording(data) {
        // Disable Stop Recording Button
        const stopBtn = document.getElementById("stopRecording");
        // Enable Stop Recording button
        stopBtn.disabled = false;
        // Remove previous event listener
        stopBtn.onclick = null;
        // Initializing our event listener
        stopBtn.onclick = async function () {
            // Request backend to stop call recording
            stopcall = await fetch(`${baseUrl}/api/stop/call`, {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }).then((response) => response.json());
            console.log(stopcall.message);

            // Disable Stop Recording Button
            stopBtn.disabled = true;
            // Enable Start Recording Button
            document.getElementById("startRecording").disabled = false;
        };
    }

## Conclusion

Hurray! Now, I can record my calls during my project review! The code base for this tutorial is available on [github](https://github.com/raysandeep/Agora-Web-Cloud-Recording).

> Note: The deployed backend has token server embeded into it. So, you don’t need to deploy a new token server!

**Not sure how to merge cloud recorded files?**

Check this out!
[raysandeep/Agora-Cloud-Recording-Merger](https://github.com/raysandeep/Agora-Cloud-Recording-Merger/)

**Stuck somewhere?**

Join our Slack community [here](https://join.slack.com/t/agoraiodev/shared_invite/zt-e7ln476c-pfWWYMs40Y7GMPz2i26pwA) to learn about product updates, participate in the beta programs, and engage in meaningful conversations with other developers.

If you see room for improvement feel free to fork the repo and make a pull request!
