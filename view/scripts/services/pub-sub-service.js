// 这是一个通用的 发布订阅模块
//参考：https://gist.github.com/turtlemonvh/10686980/038e8b023f32b98325363513bf2a7245470eaf80
app.factory('pubSubService', ['$rootScope', function ($rootScope) {
  // private notification messages
  var _DATA_UPDATED_ = '_DATA_UPDATED_';
	/*
	 * @name: publish
	 * @description: 消息发布者，只用$emit冒泡进行消息发布的低能耗无污染方法
	 * @param: {string=}: msg, 要发布的消息关键字，默认为'_DATA_UPDATED_'指数据更新
	 * @param: {object=}: data，随消息一起传送的数据，默认为空
	 * @example:
	 * 		pubSubService.publish('config.itemAdded', {'id': getID()});
	 * 	    更一般的形式是：
	 *      pubSubService.publish();
	 */
  var publish = function (msg, data) {
    msg = msg || _DATA_UPDATED_;
    data = data || {};
    $rootScope.$emit(msg, data);
  };
	/*
	 * @name: subscribe
	 * @description: 消息订阅者
	 * @param: {string=}: 消息关键字，默认为'_DATA_UPDATED_'指数据更新
	 * @param: {object=}: 控制器作用域，用以解绑定,默认为空
	 * @param: {function}: 回调函数，在订阅消息到来时执行
	 * @example:
	 * 		pubSubService.subscribe('data_change', $scope, function(event, data) {
	 *	    $scope.power = data.power;
	 *		    $scope.mass = data.mass;
	 *		});
	 *		更一般的形式是：
	 *		pubSubService.subscribe(function(){});
	 */
  var subscribe = function (msg, scope, func) {
    if (!angular.isFunction(func)) {
      console.log("pubSubService.subscribe need a callback function");
      return;
    }
    msg = msg || _DATA_UPDATED_;
    var unbind = $rootScope.$on(msg, func);
    //可控的事件反绑定机制
    if (scope) {
      scope.$on('$destroy', unbind);
    }
  };

  // return the publicly accessible methods
  return {
    publish: publish,
    subscribe: subscribe
  };
}])
