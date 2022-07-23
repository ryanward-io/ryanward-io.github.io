---
layout: post
title: Which pull request method should I use with Git?
date: 2022-05-04
summary: It only takes a few PRs for this to all make sense.
categories: git
mathjax: true
---

There are plenty of places explaining good practice for how to contribute code to a remote repository. However, I didn't see clearly when different approaches are appropriate.

There are broadly two scenarios to consider:

1.  You have write access to the repository
    - e.g. where it is your own repository, or a corporate private repository you have write permission to.
2.  You don’t have write access to the repository
    - e.g. where there is a public open-source repository that you want to try and contribute to like pandas where you won’t have write access.

Importantly for both scenarios, you don’t want to be pushing directly to the main branch as this is often the production branch – ideally there is a point of review before it gets to this point.

Also worth pointing out that there are other philosophies on how to work best in a team on git. This is aimed for analytics teams who have minimal git experience. If you are a software developer with 20 years experience you probably know what you are doing and don’t need this blogpost.

## Scenario 1 – You have write access to the repository

Let’s assume the git repository is called test.

First we’ll clone the test repository directly and move our working directory into this cloned repository.

{% highlight shell %}

git clone test
cd test

{% endhighlight %}

Then we’ll create a branch and switch to it. You can confirm the branch you are on with the `git branch` command

{% highlight shell %}

git checkout -b "test_commit"
git branch

{% endhighlight %}

Make a change in your file and save the document so you have something to stage and commit.

{% highlight shell %}

git add .
git commit -m "My example commit"

{% endhighlight %}

This is now committed in your local repository – now push it up to the central repository.

{% highlight shell %}

git push

{% endhighlight %}

Because of the way we created our branch you'll actually need to `git push --set-upstream origin test_commit`. Git will tell you this though so keep going - almost there!

From here, go to the central repository - it'll look like https://github.com/PROFILE/REPO/pulls. Here is [Pandas PR page](https://github.com/pandas-dev/pandas/pulls) for an example.

Click `New Pull Request` and you can pull your new branch into the main branch from here.

Depending on the repositories settings you might be able to do that immediately or it might need review first.

Either way, once merged you have successfully added your change to the main repository.

## Scenario 2 – You DON’T have write access to the repository

This is very similar but importantly before the git clone you need to fork the repository.

This is a button in the github repository – which is just /fork in the repo url e.g. [pandas fork](https://github.com/pandas-dev/pandas/fork).

After this follow all the steps for Scenario 1.

When you git push it will be pushed to your fork of the repository.

From here, in Github you can then send a pull request to the original branch in much the same way as for Scenario 1.

## Conclusion

Ultimately whether you need to fork or not is the key difference here but I never see it spelt out. Basically – if you have write access to the repository, no need to fork. If you have read-only then you’ll need to make a fork so you have write access on your personal copy.
