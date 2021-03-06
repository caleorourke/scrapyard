/*
#  Profile
#  Builds a GitHub profile from repo, contributors, stargazers, watchers, and tags payloads
#
#  Copyright © SoftLayer, an IBM Company
#  Code and documentation licensed under MIT
*/

// Contributors
// ------------------------------

$.getJSON("https://api.github.com/repos/softlayer/softlayer-python/contributors?callback=?", function (result) {
  numContributors = result.data;
  $(function () {
    $("#github-contributors").text(numContributors.length);
  });
});

// Repos
// ------------------------------

$.ajax({
  url: "https://api.github.com/orgs/softlayer?callback?",
  dataType: "jsonp",
  success: function (json) {
    numRepos = json.data;
    $("#github-repos").text(numRepos.public_repos);
  }
});

// Stargazers + Watchers
// ------------------------------

$.ajax({
  url: "https://api.github.com/repos/softlayer/softlayer-python?callback?",
  dataType: "jsonp",
  success: function (json) {
    numStargazers = json.data;
    $("#github-stargazers").text(numStargazers.stargazers_count);

    numWatchers = json.data;
    $("#github-watchers").text(numWatchers.subscribers_count);
  }
});

// Tags
// ------------------------------

$.ajax({
  url: "https://api.github.com/repos/softlayer/softlayer-python/tags?callback?",
  dataType: "jsonp",
  success: function (json) {
    lastTag = json.data[0];
    $("#github-version").text(lastTag.name);
  }
});

// Org Profile
// ------------------------------

(function ($) {
  repoUrl = function (repo) {
    return repoUrls[repo.name] || repo.html_url;
  };

  repoDescription = function (repo) {
    return repoDescriptions[repo.name] || repo.description;
  };

  addRepo = function (repo) {
    $item = $("<li>").addClass("repo name " + (repo.language || "").toLowerCase());
    $link = $("<a>").attr("href", repoUrl(repo)).attr("target", "_blank").appendTo($item);
    $link.append($("<h2>").text(repo.name));
    $link.append($("<h4>").text(repo.language));
    $link.append($("<h5>").text(repo.watchers));
    $link.append($("<h6>").text(repo.forks));
    $link.append($("<p>").text(repoDescription(repo)));
    $item.appendTo("#repos");
  };

  addRepos = function (repos, page) {
    repos = repos || [];
    page = page || 1;
    uri = "https://api.github.com/orgs/softlayer/repos?callback=?" + "&per_page=50" + "&page=" + page;

    return $.getJSON(uri, function (result) {
      if (result.data && result.data.length > 0) {
        repos = repos.concat(result.data);
        return addRepos(repos, page + 1);
      } else {
        return $(function () {
          $.each(repos, function (i, repo) {

            repo.pushed_at    = new Date(repo.pushed_at);
            weekHalfLife      = 1.146 * Math.pow(10, -9);
            pushDelta         = "new Date" - Date.parse(repo.pushed_at);
            createdDelta      = "new Date" - Date.parse(repo.created_at);
            weightForPush     = 1;
            weightForWatchers = 1.314 * Math.pow(10, 7);
            repo.hotness      = weightForPush * Math.pow(Math.E, -1 * weekHalfLife * pushDelta);

            return repo.hotness += weightForWatchers * repo.watchers / createdDelta;
          });

          repos.sort(function (a, b) {
            if (a.hotness < b.hotness) {
              return 1;
            }
            if (b.hotness < a.hotness) {
              return -1;
            }
          });

          $.each(repos, function (i, repo) {
            return addRepo(repo);
          });
          return repos.sort(function (a, b) {
            if (a.pushed_at < b.pushed_at) {
              return 1;
            }
            if (b.pushed_at < a.pushed_at) {
              return -1;
            }
          });
        });
      }
    });
  };

  repoUrls = {
    "": ""
  };

  repoDescriptions = {
    "": ""
  };

  return addRepos();
})(jQuery);
