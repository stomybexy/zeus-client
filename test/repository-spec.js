describe("Repository test", function () {
    var Repository = require('../build/lib/repository')
    var safe = require('safe')
    var fs = require('fs')
    var assert = require('assert')


    describe("Basic tests", function () {

        var testColl

        beforeAll(function (done) {

            // db = new Db("./testdb", {})
            done()

        })


        it("should create collections with same db object", function () {
            var col1 = Repository.create({
                collName: 'col1'
            })
            var col2 = Repository.create({
                collName: 'col2'
            })

            expect(col1.db).toBe(col2.db)


        })

        it("should create a collection", function (done) {

            var opts = {
                collName: 'testColl',
                notifyOnUpdate: true,
                notifyOnRemoved: true
            }
            testColl = Repository.create(opts)
            testColl.on('ready', done)
            testColl.on("error", done.fail)
        })

        it("should populate testColl with some data", function (done) {
            var i = 0
            safe.whilst(function () {
                return i < 100
            }, function (callback) {
                testColl.insert({
                    name: 'test ' + i,
                    description: 'test ' + i + ' description.'
                }, {}, safe.sure(callback, function (res) {
                    expect(res[0].name).toBe('test ' + i)
                    i++
                    callback()
                }))
            }, safe.sure(done.fail, done))

        })

        it('should count the number of docs in testColl', function (done) {
            testColl.find({}, safe.sure(done.fail, function (docs) {
                expect(docs.length).toBe(100)
                done()
            }))
        })

        it('should find a doc by an attribute', function (done) {
            testColl.find({
                name: 'test 1'
            }, safe.sure(done.fail, function (doc) {
                expect(doc.length).toBe(1)
                expect(doc[0].description).toBe('test 1 description.')
                done()
            }))
        })

        it('should findOne a doc by an attribute', function (done) {
            testColl.findOne({
                name: 'test 99'
            }, safe.sure(done.fail, function (doc) {
                expect(doc.description).toBe('test 99 description.')
                done()
            }))
        })

        it('should update a doc', function (done) {
            testColl.update({
                name: 'test 10'
            }, {
                    $set: {
                        description: 'test 10 description updated.'
                    }
                }, safe.sure(done.fail, function (res) {
                    expect(res).toBe(1)
                    testColl.findOne({
                        name: 'test 10'
                    }, safe.sure(done.fail, function (doc) {
                        expect(doc.name).toBe('test 10')
                        expect(doc.description).not.toBe('test 10 description.')
                        expect(doc.description).toBe('test 10 description updated.')
                        done()
                    }))

                }))
        })

        it('should replace a doc', function (done) {
            testColl.findOne({
                _id: 23
            }, safe.sure(done.fail, function (doc) {

                var newDoc = {
                    _id: doc._id,
                    name: 'new doc name',
                    description: 'new doc description.',
                    newAttr: "doc's new attr"
                }
                testColl.update({
                    _id: newDoc._id
                }, newDoc, safe.sure(done.fail, function () {
                    testColl.findOne({
                        _id: 23
                    }, safe.sure(done.fail, function (d) {
                        assert.deepEqual(d, newDoc)

                        done()
                    }))
                }))
            }))
        })

        it('should be observable on insert', function (done) {
            var onAdded = function (docs) {
                //To some staff
            }
            var onAdded2 = function (docs) {
                //To some staff
            }
            var listner = {
                attr: 0,
                added: onAdded
            }

            var listner2 = {
                attr: 0,
                added: onAdded2
            }

            spyOn(listner, 'added')
            spyOn(listner2, 'added')

            testColl.on('added', listner.added)
            testColl.on('added', listner2.added)

            testColl.insert({
                name: 'test 1000',
                description: 'added observer test'
            }, {}, safe.sure(done.fail, function (docs) {
                expect(listner.added).toHaveBeenCalledWith(docs)
                expect(listner2.added).toHaveBeenCalledWith(docs)
                // expect(listner.attr).toBe(1)
                // expect(listner2.attr).toBe(2)

                done()
            }))
        })

        it('should be compatible with bind on added observers', function (done) {
            var onAdded = function (docs) {
                //To some staff
                this.attr = 1
                this.name = docs[0].name
            }
            var onAdded2 = function (docs) {
                //To some staff*
                this.attr = 2
                this.name = docs[0].name
            }
            var listner = {
                attr: 0,
                added: onAdded
            }

            var listner2 = {
                attr: 0,
                added: onAdded2
            }


            testColl.on('added', listner.added.bind(listner))
            testColl.on('added', listner2.added.bind(listner2))

            testColl.insert({
                name: 'test 1000',
                description: 'added observer test'
            }, {}, safe.sure(done.fail, function (docs) {
                expect(listner.attr).toBe(1)
                expect(listner2.attr).toBe(2)
                expect(listner.name).toBe('test 1000')
                expect(listner2.name).toBe('test 1000')
                done()
            }))
        })


        it('should be observable on update', function (done) {
            var onModified = function (after, before) {
                //To some staff
            }
            var onModified2 = function (after, before) {
                //To some staff
            }
            var listner = {
                attr: 0,
                modified: onModified
            }

            var listner2 = {
                attr: 0,
                modified: onModified2
            }

            spyOn(listner, 'modified')
            spyOn(listner2, 'modified')

            testColl.on('modified', listner.modified)
            testColl.on('modified', listner2.modified)

            testColl.update({
                _id: 2

            }, {
                    $set: {
                        description: 'modified observer test 2'
                    }
                }, safe.sure(done.fail, function () {
                    setTimeout(function () {
                        expect(listner.modified).toHaveBeenCalled()
                        expect(listner2.modified).toHaveBeenCalled()
                        done()
                    }, 100);



                }))
        })

        it('should call observers on update with the docs before and after operation', function (done) {
            var onModified = function (after, before) {
                //To some staff
                this.before = before[0].name
                this.after = after[0].name
            }

            var listner = {
                before: '',
                after: '',
                modified: onModified
            }



            testColl.on('modified', listner.modified.bind(listner))

            testColl.update({
                name: 'test 2'

            }, {
                    $set: {
                        name: 'test 2 modified'
                    }
                }, safe.sure(done.fail, function () {
                    setTimeout(function () {
                        expect(listner.before).toBe('test 2')
                        expect(listner.after).toBe('test 2 modified')
                        done()
                    }, 100);



                }))
        })

        it('should remove a doc', function (done) {
            testColl.findOne({
                name: 'test 30'
            }, safe.sure(done.fail, function (obj) {
                expect(obj.name).toBe('test 30')
                testColl.remove({
                    name: 'test 30'
                }, function (res) {
                    testColl.findOne({
                        name: 'test 30'
                    }, safe.sure(done.fail, function (obj) {
                        expect(obj).toBe(null)
                        done()
                    }))

                })
            }))

        })
        it('should call the listner on removed', function (done) {
            var onRemoved = function (removedDoc) {

            }
            var listner = {
                removed: onRemoved
            }

            spyOn(listner, 'removed')

            testColl.on('removed', listner.removed)

            testColl.findOne({
                name: 'test 1'
            }, safe.sure(done.fail, function (doc) {
                testColl.remove({
                    name: 'test 1'
                }, safe.sure(done.fail, function (res) {
                    // expect(res).toBe(1)
                    expect(listner.removed).toHaveBeenCalledWith([doc])
                    done()
                }))
            }))


        })

        it('should call the listner on removed and bind to the right env', function (done) {
            var onRemoved = function (removedDoc) {

                this.name = removedDoc[0].name
            }
            var listner = {
                name: '',
                removed: onRemoved
            }

            // spyOn(listner, 'removed')

            testColl.on('removed', listner.removed.bind(listner))

            testColl.remove({
                name: 'test 23'
            }, safe.sure(done.fail, function (res) {
                expect(listner.name).toBe('test 23')
                done()
            }))
        })

        afterAll(function (done) {
            fs.unlink('./db/testColl', safe.sure(done.fail, done))
            // db.close(safe.sure(done.fail, done))
        })
    })

})
