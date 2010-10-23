class MsgThread < ActiveRecord::Base
    has_many :posts
    has_one :first_post, :class_name => "Post", :conditions => "post_index = 0"
    has_one :user, :through => :first_post
    attr_accessible :title, :post_count, :user
    validates :title, :presence => true
end
