// META: title=NativeIO API: Acquiring, displaying and releasing capacity.
// META: global=window,worker

'use strict';

promise_test(async testCase => {
  var available_capacity = await nativeIO.getRemainingCapacity();
  testCase.add_cleanup(async () => {
    await nativeIO.releaseCapacity(2);
  });
  assert_equals(
    available_capacity, 0,
    'A execution context should starts with no capacity.');
  const requested_capacity = 4;
  available_capacity = await nativeIO.requestCapacity(requested_capacity);
  assert_equals(
    available_capacity, requested_capacity,
    'nativeIO.requestCapacity should grant the requested capacity.');
  const released_capacity = 2;
  available_capacity = await nativeIO.releaseCapacity(released_capacity);
  assert_equals(
    available_capacity, requested_capacity - released_capacity,
    'nativeIO.releaseCapacity() should release the specified capacity.');
}, 'NativeIOFileManager.getRemainingCapacity() reports the available capacity');

promise_test(async testCase => {
  const file = await nativeIO.open('test_file');
  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete('test_file');
    await nativeIO.releaseCapacity(4);
  });

  await promise_rejects_dom(testCase, 'QuotaExceededError', file.setLength(4));

  let available_capacity = await nativeIO.requestCapacity(2);
  assert_equals(
    available_capacity, 2,
    'nativeIO.requestCapacity should grant the requested capacity.');

  await promise_rejects_dom(testCase, 'QuotaExceededError', file.setLength(4));

  available_capacity = await nativeIO.requestCapacity(2);
  assert_equals(
    available_capacity, 4,
    'nativeIO.requestCapacity should grant the requested capacity again.');
  await file.setLength(4);
}, 'setLength() fails if insufficient capacity is allocated.')


promise_test(async testCase => {
  const file = await nativeIO.open('test_file');
  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete('test_file');
    await nativeIO.releaseCapacity(4);
  });
  const writeSharedArrayBuffer = new SharedArrayBuffer(4);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([64, 65, 66, 67]);

  await promise_rejects_dom(testCase, 'QuotaExceededError',
    file.write(writtenBytes, 0));

  let available_capacity = await nativeIO.requestCapacity(2);
  assert_equals(
    available_capacity, 2,
    'nativeIO.requestCapacity should grant the requested capacity.');

  await promise_rejects_dom(testCase, 'QuotaExceededError',
    file.write(writtenBytes, 0));

  available_capacity = await nativeIO.requestCapacity(2);
  assert_equals(
    available_capacity, 4,
    'nativeIO.requestCapacity should grant the requested capacity again.');
  await file.write(writtenBytes, 0);
}, 'write() fails if insufficient capacity is allocated.')
