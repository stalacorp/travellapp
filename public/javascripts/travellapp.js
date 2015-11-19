var app = angular.module("travellapp", ['ngResource', 'ngRoute','personsapp']);
app.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'main/home.html'
        })
        .when('/login', {templateUrl: 'users/login.html', controller: 'LoginCtrl', title:'Login'})
        .when('/logout', {controller: 'LogoutCtrl'})
        .otherwise({
            redirectTo: '/'
        });
}], function(uiGmapGoogleMapApiProvider){
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyCJOLfo5eFbcn_lBz9i7YNzvgwTazgLdMU',
        v: '3.20' //defaults to latest 3.X anyhow

    });
});
app.run(['$location', '$rootScope', '$route', 'AuthService', function($location, $rootScope, $route, AuthService) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        $rootScope.isLoggedIn = AuthService.isLoggedIn();
        //if (AuthService.isLoggedIn() === false) {
        //    $location.path('/login');
        //}
    });
}]);

app.controller('NavCtrl', ['$scope', '$location', 'AuthService',
    function($scope, $location, AuthService){
        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };
    }]);

app.controller('LoginCtrl',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {

            console.log(AuthService.getUserStatus());

            $scope.login = function () {

                // initial values
                $scope.error = false;
                $scope.disabled = true;

                // call login from service
                AuthService.login($scope.loginForm.username, $scope.loginForm.password)
                    // handle success
                    .then(function () {
                        $location.path('/');
                        $scope.disabled = false;
                        $scope.loginForm = {};
                    })
                    // handle error
                    .catch(function () {
                        $scope.error = true;
                        $scope.errorMessage = "Onjuiste gebruikersnaam en/of wachtwoord";
                        $scope.disabled = false;
                        $scope.loginForm = {};
                    });

            };

        }]);
app.controller('LogoutCtrl',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {
            $scope.logout = function () {

                // call logout from service
                AuthService.logout()
                    .then(function () {
                        $location.path('/login');
                    });

            };

        }]);


