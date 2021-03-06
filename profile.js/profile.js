/*
 #  Profile
 #  Builds a GitHub profile out of repository payloads
 #
 #  Copyright © Softlayer, an IBM Company
 #  Code and documentation licensed under MIT
 */


$.getJSON("https://api.github.com/repos" + "/" + "{{site.github.owner_name}}" + "/" + "{{site.github.project_title}}" + "/" + "contributors?callback=?", function(result) {
    numContributors = result.data;
    $(function() {
        $("#github-contributors").text(numContributors.length);
    });
});

$.ajax({
    url: "https://api.github.com/repos" + "/" + "{{site.github.owner_name}}" + "/" + "{{site.github.project_title}}" + "?callback?",
    dataType: "jsonp",
    success: function(json) {
        numStargazers = json.data;
        $("#github-stargazers").text(numStargazers.stargazers_count);
    }
});

(function($) {
    repoUrl = function(repo) {
        return repoUrls[repo.name] || repo.html_url;
    };

    repoDescription = function(repo) {
        return repoDescriptions[repo.name] || repo.description;
    };

    addRepo = function(repo) {
        $item      = $("<li>").addClass("repo name " + (repo.language || "").toLowerCase());
        $link      = $("<a>").attr("href", repoUrl(repo)).attr("target", "_blank").appendTo($item);
        $link.append($("<h2>").text(repo.name));
        $link.append($("<h4>").text(repo.language));
        $link.append($("<h5>").text(repo.watchers));
        $link.append($("<h6>").text(repo.forks));
        $link.append($("<p>").text(repoDescription(repo)));

        $item.appendTo("#github-projects");
    };

    addRepos = function(repos, page) {
        repos = repos || [];
        page  = page  || 1;
        uri   = "https://api.github.com/users" + "/" + "{{site.github.owner_name}}" + "/" + "repos?callback=?" + "&per_page=50" + "&page="+ page;
        // if you're an organization, use ("https://api.github.com/orgs/"  + "{{site.github.owner_name}}/" + "repos?callback=?")

        $.getJSON(uri, function(result) {
            if (result.data && result.data.length > 0) {
                repos = repos.concat(result.data);
                return addRepos(repos, page + 1);
            }
            else {
                $(function() {
                    $("#github-repos").text(repos.length);

                    $.each(repos, function(i, repo) {
                        repo.pushed_at    = new Date(repo.pushed_at);
                        weekHalfLife      = 1.146 * Math.pow(10, -9);
                        pushDelta         = "new Date" - Date.parse(repo.pushed_at);
                        createdDelta      = "new Date" - Date.parse(repo.created_at);
                        weightForPush     = 1;
                        weightForWatchers = 1.314 * Math.pow(10, 7);
                        repo.popularity   = weightForPush * Math.pow(Math.E, -1 * weekHalfLife * pushDelta);

                        return repo.popularity += weightForWatchers * repo.watchers / createdDelta;
                    });

                    repos.sort(function(a, b) {
                        if (a.popularity < b.popularity) {
                            return 1;
                        }
                        if (b.popularity < a.popularity) {
                            return -1;
                        }
                    });

                    $.each(repos, function(i, repo) {
                        return addRepo(repo);
                    });

                    return repos.sort(function(a, b) {
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
