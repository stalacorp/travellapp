var app = angular.module("travellapp", ['ngResource', 'ngRoute','personsapp']);
app.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'main/home.html',
            controller: 'HomeCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}], function(uiGmapGoogleMapApiProvider){
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyCJOLfo5eFbcn_lBz9i7YNzvgwTazgLdMU',
        v: '3.20' //defaults to latest 3.X anyhow

    });
});

