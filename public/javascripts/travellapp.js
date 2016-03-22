var app = angular.module("travellapp", ['ngResource', 'ngRoute', 'personsapp', 'routesapp', 'angucomplete-alt']);
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'main/search.html',
            controller: 'SearchCtrl',
            title: 'Zoeken in welke auto',
            access: 'open'
        })
        .when('/fixture', {
            templateUrl: 'main/fixture.html',
            controller: 'FixtureCtrl',
            title: 'Laden van main user',
            access: 'open'
        })
        .when('/login', {templateUrl: 'users/login.html', controller: 'LoginCtrl', title: 'Login', access: 'open'})
        .when('/logout', {controller: 'LogoutCtrl'})
        .when('/users', {templateUrl: 'users/overview.html', controller: 'UsersCtrl'})
        .when('/profile', {templateUrl: 'users/profile.html', controller: 'ProfileCtrl'})
        .otherwise({
            redirectTo: '/'
        });
}]);
app.run(['$location', '$rootScope', '$route', 'AuthService', function ($location, $rootScope, $route, AuthService) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        var user = AuthService.getUser();
        console.log(user);
        if (user != null) {
            $rootScope.isLoggedIn = true;
            $rootScope.isAdmin = user.isAdmin;
        }


        if (next.access !== 'open') {
            if ((AuthService.isLoggedIn() === false && next.access === undefined) || (next.access === 'admin' && user.isAdmin !== true)) {
                $location.path('/login');
                $route.reload();
            }
        }
    });
}]);

app.controller('NavCtrl', ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {
        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };
    }]);

app.controller('LoginCtrl',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {


            $scope.login = function () {

                // initial values
                $scope.error = false;
                $scope.disabled = true;

                // call login from service
                AuthService.login($scope.loginForm.username, $scope.loginForm.password)
                    // handle success
                    .then(function () {
                        $location.path('/journeys/overview');
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

app.controller('ProfileCtrl',
    ['$scope', '$location', '$resource', 'AuthService',
        function ($scope, $location, $resource, AuthService) {
            $scope.error = false;
            $scope.change = function () {
                $scope.error = false;
                var password = $scope.newPassword1;

                if (($scope.newPassword1 == $scope.newPassword2) && password.length == 8) {
                    var user = AuthService.getUser();

                    user.password = password;

                    var User = $resource('/user/:id', {id: '@_id'}, {
                        update: {method: 'PUT'}
                    });

                    User.update(user);

                    $location.path('/journeys/overview');
                } else {
                    $scope.error = true;
                    $scope.errorMessage = "Błąd!";
                }

            };

        }]);

app.controller('UsersCtrl',
    ['$scope', '$location', '$resource',
        function ($scope, $location, $resource) {

            var Users = $resource('/user/')
            var users = [];
            Users.query(function (userobjs) {
                users = userobjs;
                $scope.users = userobjs;
            });

            $scope.update = function (theuser) {
                $scope.user = theuser;
            };

            $scope.add = function () {
                if ($scope.update) {
                    var Users = $resource('/user/:id', {id: '@_id'}, {
                        update: {method: 'PUT'}
                    });
                    Users.update($scope.user);

                } else {
                    var Users = $resource('/user/');
                    Users.save($scope.user, function (response) {
                        $scope.users.push(response);
                    });
                }
            };

            $scope.delete = function () {
                if($scope.update) {
                    var User = $resource('/user/:id');
                    User.delete({id: $scope.user_id});

                    //User.update($scope.user);
                    $scope.users.splice(index, 1);
                }
            };


        }]);

app.controller('FixtureCtrl',
    ['$scope', '$location', '$resource',
        function ($scope, $location, $resource) {
            $scope.success = false;
            $scope.addFixture = function () {
                var User = $resource('/user/fixture');
                User.save({keyword: $scope.keyword}, function (response) {
                    if (response.success) {
                        $scope.success = true;
                    }
                });
            };


        }]);

app.controller('SearchCtrl', ['$scope', '$resource', '$location',
    function ($scope, $resource, $location) {

        $scope.active = false;
        $scope.found = false;
        var journey;
        var JourneysActive = $resource('/journeys/upcoming');


        JourneysActive.get(function (obj) {
            if (obj) {
                journey = obj;
                $scope.active = true;
                journey.persons.forEach(function (p) {
                    p.fullname = p.firstname + " " + p.lastname;
                });

                $scope.persons = journey.persons;
            }

        });

        $scope.personMatch = function (selected) {
            $scope.found = false;
            if (selected) {
                var person = selected.originalObject;
                $scope.person = person._id;

                journey.vehicles.forEach(function (v) {
                    if (v.owner._id == person._id) {
                        $scope.vehicle = v;
                        $scope.found = true;
                    }

                    v.passengers.forEach(function (p) {
                        if (p._id == person._id) {
                            $scope.vehicle = v;
                            $scope.found = true;
                        }
                    });
                });

                if ($scope.vehicle) {
                    var date = new Date($scope.vehicle.duration * 1000);
                    var hh = date.getUTCHours();
                    var mm = date.getUTCMinutes();

                    $scope.duration = hh + ' uren en ' + mm + ' minuten';
                }
            }
        };

        $scope.clearInput = function () {
            $scope.$broadcast('angucomplete-alt:clearInput');
        };


    }]);


